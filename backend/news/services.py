"""
DevPulse Daily Newspaper Briefing Service.
Synthesizes a structured morning newspaper briefing covering Top Stories,
AI & Frontier Tech, Technology Markets & Earnings, Layoffs, Architecture, and Security.
"""

from django.utils import timezone
from news.models import Article, DailyBriefing
from markets.services import MarketDataService

def generate_daily_briefing(target_date=None) -> DailyBriefing:
    """
    Synthesize and persist today's curated morning edition briefing from top scored articles.
    """
    if not target_date:
        target_date = timezone.now().date()

    briefing = DailyBriefing.objects.filter(date=target_date).first()
    if briefing and briefing.top_stories.count() >= 5:
        return briefing

    # Fetch top articles across diverse desks
    all_top = list(Article.objects.select_related('source', 'category', 'intelligence').order_by('-importance_score', '-published_at')[:20])

    if not all_top:
        overview_text = "No updates recorded for today."
        top_articles = []
    else:
        # Group top stories across desks
        top_stories = all_top[:7]
        top_articles = top_stories

        date_str = target_date.strftime('%A, %B %d, %Y')
        overview_sections = [
            f"# DevPulse Daily Morning Edition — {date_str}\n",
            "Good morning. Here is your daily technology newspaper executive briefing covering the essential technical, financial, and strategic movements across the global technology industry.\n",
            "### 1. Leading Technology Developments",
        ]

        for a in top_stories[:3]:
            sub = a.subheadline or (a.intelligence.concise_summary if hasattr(a, 'intelligence') else a.title)
            overview_sections.append(f"• **{a.title}** ({a.editorial_desk})\n  {sub}\n")

        # Markets section
        try:
            overview_data = MarketDataService.get_market_overview()
            overview_sections.append("### 2. Technology Markets & Financial Desk")
            session = overview_data['session']
            indices_str = " | ".join(f"{idx.name.split(' ')[0]}: {float(idx.current_value):,.1f} ({float(idx.change_percent):+.2f}%)" if hasattr(idx, 'current_value') else "" for idx in overview_data['indices'][:3])
            overview_sections.append(f"**Session Status:** {session['status']} (15-min delayed).")
            if overview_data['gainers']:
                top_g = overview_data['gainers'][0]
                overview_sections.append(f"• **Market Movers:** ${top_g.ticker} ({top_g.company_name}) gained {float(top_g.change_percent):+.2f}%. {top_g.movement_context or ''}\n")
        except Exception:
            pass

        # Sectoral highlights
        overview_sections.append("### 3. Engineering, AI & Systems Infrastructure")
        for a in all_top[3:6]:
            sub = a.subheadline or (a.intelligence.concise_summary if hasattr(a, 'intelligence') else a.title)
            overview_sections.append(f"• **{a.title}**: {sub}\n")

        overview_sections.append("### 4. What Happens Next (Watchlist)")
        overview_sections.append(
            "• Monitor scheduled enterprise earnings releases, regulatory antitrust disclosures, and pending kernel patch deployments over the upcoming trading sessions."
        )

        overview_text = "\n".join(overview_sections)

    if not briefing:
        briefing = DailyBriefing.objects.create(
            date=target_date,
            title=f"DevPulse Morning Newspaper Briefing — {target_date.strftime('%B %d, %Y')}",
            overview=overview_text,
            reading_time_minutes=max(4, len(overview_text.split()) // 180),
        )
    else:
        briefing.title = f"DevPulse Morning Newspaper Briefing — {target_date.strftime('%B %d, %Y')}"
        briefing.overview = overview_text
        briefing.save()

    briefing.top_stories.set(top_articles)
    return briefing
