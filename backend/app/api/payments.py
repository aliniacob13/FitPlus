import stripe
from fastapi import APIRouter, Depends, HTTPException, Request, Header
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timedelta

# Adjust these imports based on your actual project structure
from app.core.config import settings
from app.core.database import get_db # Assuming you have a get_db dependency
from app.models.subscription import Subscription
# from app.api.deps import get_current_user # Uncomment when auth is ready

router = APIRouter(prefix="/payments", tags=["Payments"])

stripe.api_key = settings.STRIPE_SECRET_KEY

class CheckoutRequest(BaseModel):
    gym_id: int
    plan_type: str

@router.post("/checkout")
async def create_checkout_session(
    request: CheckoutRequest,
    # current_user = Depends(get_current_user), # Uncomment when auth is ready
    db: AsyncSession = Depends(get_db)
):
    if not settings.STRIPE_SECRET_KEY:
        raise HTTPException(status_code=500, detail="Stripe API key is not configured.")

    try:
        # Create a Stripe Checkout Session
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': 'ron', # Or usd/eur based on your preference
                    'product_data': {
                        'name': f'FitPlus Gym Membership - {request.plan_type}',
                    },
                    'unit_amount': 15000, # Example: 150.00 RON. You should query this from your Gym model later!
                },
                'quantity': 1,
            }],
            mode='subscription',
            # Deep links back to your mobile app (React Native/Expo)
            success_url='exp://localhost:8081/--/success?session_id={CHECKOUT_SESSION_ID}',
            cancel_url='exp://localhost:8081/--/cancel',
            # Metadata is crucial: it passes this data to the webhook later
            metadata={
                "gym_id": str(request.gym_id),
                "plan_type": request.plan_type,
                "user_id": "1", # Hardcoded for now until get_current_user is active
            }
        )
        return {"checkout_url": checkout_session.url}
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/webhook")
async def stripe_webhook(request: Request, stripe_signature: str = Header(None), db: AsyncSession = Depends(get_db)):
    """
    Stripe calls this endpoint automatically when a payment succeeds.
    """
    webhook_secret = settings.STRIPE_WEBHOOK_SECRET
    payload = await request.body() # Stripe needs the raw body to verify the signature

    try:
        event = stripe.Webhook.construct_event(
            payload=payload, 
            sig_header=stripe_signature, 
            secret=webhook_secret
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError as e:
        raise HTTPException(status_code=400, detail="Invalid signature")

    # Handle the checkout.session.completed event
    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        
        # Extract the metadata we passed in the /checkout route
        user_id = int(session.get('metadata', {}).get('user_id', 0))
        gym_id = int(session.get('metadata', {}).get('gym_id', 0))
        plan_type = session.get('metadata', {}).get('plan_type', 'Unknown')
        stripe_sub_id = session.get('subscription')

        if user_id and gym_id:
            # Create the subscription record in the database
            new_subscription = Subscription(
                user_id=user_id,
                gym_id=gym_id,
                plan_type=plan_type,
                status="active",
                stripe_subscription_id=stripe_sub_id,
                start_date=datetime.utcnow(),
                end_date=datetime.utcnow() + timedelta(days=30) # Assuming monthly
            )
            db.add(new_subscription)
            await db.commit()
            print(f"✅ Subscription created for User {user_id} at Gym {gym_id}")

    return {"status": "success"}