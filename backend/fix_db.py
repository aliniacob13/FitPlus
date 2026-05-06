import asyncio
import asyncpg
from app.core.config import settings

async def fix_database():
    try:
        # Connect to database
        conn = await asyncpg.connect(
            host=settings.POSTGRES_HOST,
            port=settings.POSTGRES_PORT,
            database=settings.POSTGRES_DB,
            user=settings.POSTGRES_USER,
            password=settings.POSTGRES_PASSWORD
        )
        
        print("Connected to database")
        
        # Check if column exists
        result = await conn.fetchval("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'daily_calorie_target'
        """)
        
        if result:
            print("Column 'daily_calorie_target' already exists")
        else:
            print("Adding column 'daily_calorie_target'...")
            await conn.execute("""
                ALTER TABLE users 
                ADD COLUMN daily_calorie_target FLOAT
            """)
            print("Column 'daily_calorie_target' added successfully")
        
        # Check if nutrition_target_updated_at exists
        result = await conn.fetchval("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'nutrition_target_updated_at'
        """)
        
        if result:
            print("Column 'nutrition_target_updated_at' already exists")
        else:
            print("Adding column 'nutrition_target_updated_at'...")
            await conn.execute("""
                ALTER TABLE users 
                ADD COLUMN nutrition_target_updated_at TIMESTAMP WITH TIME ZONE
            """)
            print("Column 'nutrition_target_updated_at' added successfully")
        
        await conn.close()
        print("Database fixed successfully!")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(fix_database())
