def generate_local_fallback_insights(
    totals: dict, highest_impact_category: str, target_kg: float, streak: int
) -> str:
    """
    Python-based local rules engine to provide personalized recommendations
    targeting the user's highest emitting category.
    """
    if not highest_impact_category:
        return (
            "### Welcome to CarbonLens! 🌿\n"
            "Start logging your transport, energy, food, or waste entries above to see your breakdown.\n\n"
            "**Tip**: Setting a daily target (the default is 5.5 kg CO2e) will help you establish a streak. Log entries to build momentum!"
        )

    net_emissions = sum(totals.values())
    category_val = totals.get(highest_impact_category, 0.0)

    advice = (
        f"### Carbon Coach Insights (Rule Engine) ⚡\n\n"
        f"Your highest emissions today come from **{highest_impact_category.upper()}** ({category_val:.2f} kg CO2e).\n"
        f"Your total emissions are **{net_emissions:.2f} kg CO2e** compared to your daily budget of **{target_kg:.2f} kg CO2e**.\n\n"
    )

    if streak > 0:
        advice += f"🔥 **Streak Alert**: You are on a **{streak}-day streak** of keeping your emissions under target! Keep it up!\n\n"

    advice += f"Here are personalized actions to target your **{highest_impact_category}** emissions:\n\n"

    # Action catalog based on category
    recommendations = {
        "transport": [
            "- **Swap one car trip a day for the train**: Replacing a 20km petrol car commute cuts most of that trip's emissions. *(Potential saving: −3.0 kg/day)*",
            "- **Bike for trips under 5km**: Short car trips are inefficient — biking removes them entirely. *(Potential saving: −1.9 kg/day)*",
            "- **Carpool twice a week**: Splitting a commute roughly halves its footprint per person. *(Potential saving: −1.1 kg/day)*",
        ],
        "energy": [
            "- **Switch to a renewable electricity plan**: Grid electricity from renewable sources cuts your footprint dramatically. *(Potential saving: −4.2 kg/day)*",
            "- **Lower heating by 2°C in winter**: Small temperature adjustments compound significantly. *(Potential saving: −1.3 kg/day)*",
            "- **Unplug devices on standby overnight**: Standby power draw is small but adds up. *(Potential saving: −0.4 kg/day)*",
        ],
        "food": [
            "- **Go meat-free 2 days a week**: Red meat has one of the highest footprints per meal. *(Potential saving: −1.6 kg/day)*",
            "- **Swap one dairy serving for a plant alternative**: Cuts emissions relative to dairy production. *(Potential saving: −0.7 kg/day)*",
            "- **Choose local, in-season produce**: Cuts transport and cold-storage emissions. *(Potential saving: −0.3 kg/day)*",
        ],
        "waste": [
            "- **Sort recyclables instead of binning them**: Recycling has a lower footprint than landfill disposal. *(Potential saving: −0.5 kg/day)*",
            "- **Compost food scraps**: Composting avoids the methane that food waste generates in landfill. *(Potential saving: −0.3 kg/day)*",
        ],
    }

    category_actions = recommendations.get(highest_impact_category.lower(), [])
    for action in category_actions:
        advice += f"{action}\n"

    # Cross-cutting secondary tip
    alternative_category = next(
        (
            cat
            for cat, val in totals.items()
            if cat != highest_impact_category and val > 0
        ),
        None,
    )
    if alternative_category:
        alt_actions = recommendations.get(alternative_category.lower(), [])
        if alt_actions:
            advice += (
                f"\n**Secondary Tip (for {alternative_category})**:\n{alt_actions[0]}\n"
            )

    return advice
