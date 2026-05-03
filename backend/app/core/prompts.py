from app.models.user import User


WORKOUT_SYSTEM_PROMPT = (
    "You are FitPlus Workout Coach. Give safe, practical, actionable plans with sets, reps and rest times. "
    "Always adapt recommendations to user level and goals. If context is incomplete, ask one concise follow-up."
)

DIET_SYSTEM_PROMPT = (
    "You are FitPlus Diet Counselor. Provide budget-aware, realistic meal suggestions and grocery guidance. "
    "Always respect user constraints from profile and prior context. If context is incomplete, ask one concise follow-up."
)


def build_user_profile_context(user: User) -> str:
    return (
        "USER PROFILE CONTEXT:\n"
        f"- Name: {user.name or 'Unknown'}\n"
        f"- Age: {user.age if user.age is not None else 'Unknown'}\n"
        f"- Weight kg: {user.weight_kg if user.weight_kg is not None else 'Unknown'}\n"
        f"- Height cm: {user.height_cm if user.height_cm is not None else 'Unknown'}\n"
        f"- Fitness level: {user.fitness_level or 'Unknown'}\n"
        f"- Goals: {user.goals or 'Not provided'}"
    )


def build_system_prompt(base_prompt: str, user: User, additional_context: str = "") -> str:
    prompt_parts = [base_prompt, build_user_profile_context(user)]
    if additional_context.strip():
        prompt_parts.append(additional_context.strip())
    return "\n\n".join(prompt_parts)
