from html.parser import HTMLParser
from pathlib import Path
import unittest


REPOSITORY_ROOT = Path(__file__).resolve().parents[1]
PUBLIC_PAGES = (
    REPOSITORY_ROOT / "index.html",
    REPOSITORY_ROOT / "margincommand.html",
    REPOSITORY_ROOT / "margincommand_pilot_links_live.html",
    REPOSITORY_ROOT / "founderrelease.html",
)
MARGINCOMMAND_PAGES = (
    REPOSITORY_ROOT / "margincommand.html",
    REPOSITORY_ROOT / "margincommand_pilot_links_live.html",
)
PROGRAM_PAGES = (
    REPOSITORY_ROOT / "index.html",
    *MARGINCOMMAND_PAGES,
)
FORBIDDEN_IDENTITY = (
    "Raeford",
    "Founder & Chief Architect",
    "Founder, MarginCommand",
)
FORBIDDEN_HOMEPAGE_PORTFOLIO = (
    "Four Divisions",
    "Founder Release Readiness",
    "GovReady AI",
    "Drone Ops",
    "Kinetic Zero",
    "Prop Trading",
    "active revenue engine",
)
FORBIDDEN_PROGRAM_COPY = (
    "Powered by Google Cloud",
    "Google Partner",
    "NVIDIA partner",
    "endorsed by Google",
    "endorsed by NVIDIA",
)
NVIDIA_BADGE = (
    REPOSITORY_ROOT
    / "assets/programs/nvidia-inception-program-badge-rgb-for-screen.jpg"
)
NVIDIA_BADGE_URL = (
    "assets/programs/nvidia-inception-program-badge-rgb-for-screen.jpg"
)
DEMO_VIDEO = (
    REPOSITORY_ROOT
    / "assets/video/MarginCommand_Community_Dinner_Natural_Cadence_83s.mp4"
)
DEMO_VIDEO_URL = (
    "assets/video/MarginCommand_Community_Dinner_Natural_Cadence_83s.mp4"
)
SHORT_COMMERCIAL_VIDEO = (
    REPOSITORY_ROOT / "assets/video/margincommandv1.mp4"
)
SHORT_COMMERCIAL_VIDEO_URL = "assets/video/margincommandv1.mp4"
CLOUDFLARE_MAX_ASSET_BYTES = 25 * 1024 * 1024
PROMOTED_BETA_URL = "https://margincommand-app-e7fq2xpfwa-ue.a.run.app"
PILOT_APPLICATION_URL = (
    "https://docs.google.com/forms/d/e/"
    "1FAIpQLSfiqyKsns1R0NEWjN9HYnwVzwx4WiN5mdiIr_Ykz0b-8dr32Q/"
    "viewform?usp=publish-editor"
)
FAVICON_URL = "vetops-shield.png"


class PublicPageParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links = []
        self.metas = []
        self.tags = []
        self.text_parts = []
        self._active_link = None
        self._ignored_content_depth = 0

    def handle_starttag(self, tag, attrs):
        attributes = dict(attrs)
        self.tags.append((tag, attributes))
        if tag in ("script", "style"):
            self._ignored_content_depth += 1
        if tag == "meta":
            self.metas.append(attributes)
        if tag == "a":
            self._active_link = {
                "href": attributes.get("href", ""),
                "text": [],
            }

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)

    def handle_data(self, data):
        if self._ignored_content_depth:
            return
        self.text_parts.append(data)
        if self._active_link is not None:
            self._active_link["text"].append(data)

    def handle_endtag(self, tag):
        if tag in ("script", "style"):
            self._ignored_content_depth -= 1
        if tag == "a" and self._active_link is not None:
            self.links.append(
                (
                    " ".join("".join(self._active_link["text"]).split()),
                    self._active_link["href"],
                )
            )
            self._active_link = None

    @property
    def visible_text(self):
        return " ".join(" ".join(self.text_parts).split())


def parse_page(page):
    parser = PublicPageParser()
    parser.feed(page.read_text(encoding="utf-8"))
    return parser


class PublicConsistencyTests(unittest.TestCase):
    def test_public_pages_declare_existing_favicon(self):
        self.assertTrue(
            (REPOSITORY_ROOT / FAVICON_URL).is_file(),
            f"Missing {FAVICON_URL}",
        )
        for page in PUBLIC_PAGES:
            with self.subTest(page=page.name):
                favicons = [
                    attrs.get("href", "")
                    for tag, attrs in parse_page(page).tags
                    if tag == "link"
                    and "icon" in attrs.get("rel", "").lower().split()
                ]
                self.assertIn(FAVICON_URL, favicons)

    def test_public_pages_use_fayetteville(self):
        for page in PUBLIC_PAGES:
            with self.subTest(page=page.name):
                text = parse_page(page).visible_text
                self.assertIn("Fayetteville", text)
                self.assertNotIn("Raeford", text)

    def test_public_pages_use_founder_and_ceo(self):
        for page in PUBLIC_PAGES:
            with self.subTest(page=page.name):
                text = parse_page(page).visible_text
                self.assertIn("Founder & CEO", text)
                for forbidden in FORBIDDEN_IDENTITY:
                    self.assertNotIn(forbidden, text)

    def test_homepage_is_margincommand_only(self):
        text = parse_page(REPOSITORY_ROOT / "index.html").visible_text
        self.assertIn("VetOps Financial develops MarginCommand", text)
        self.assertIn("One Product. One Commercialization Mission.", text)
        for forbidden in FORBIDDEN_HOMEPAGE_PORTFOLIO:
            with self.subTest(forbidden=forbidden):
                self.assertNotIn(forbidden, text)

    def test_homepage_preserves_review_anchor_and_canonical_explore_links(self):
        homepage = parse_page(REPOSITORY_ROOT / "index.html")
        self.assertIn(("MarginCommand", "#margincommand"), homepage.links)

        explore_links = [
            href
            for text, href in homepage.links
            if "Explore MarginCommand" in text
        ]
        self.assertTrue(explore_links, "No Explore MarginCommand links found")
        self.assertEqual(["/margincommand"] * len(explore_links), explore_links)

    def test_homepage_sequences_beachhead_before_gated_expansion(self):
        text = parse_page(REPOSITORY_ROOT / "index.html").visible_text
        sequencing = (
            "The beachhead is owner-operated event catering. The same "
            "quote-to-actual mechanism applies to any fixed-price job "
            "business — custom woodworking and small trade contractors "
            "are the first expansion markets, gated on catering validation."
        )
        self.assertIn(sequencing, text)

    def test_homepage_has_no_founderrelease_link(self):
        homepage = parse_page(REPOSITORY_ROOT / "index.html")
        founderrelease_links = [
            href
            for _, href in homepage.links
            if "founderrelease" in href.lower()
        ]
        self.assertEqual([], founderrelease_links)

    def test_homepage_uses_ongoing_founder_operated_proof(self):
        text = parse_page(REPOSITORY_ROOT / "index.html").visible_text
        required = (
            "Ongoing",
            "founder-operated use",
            "Built in the Business.",
            "Used on Real Work.",
            "used for months",
            "representative examples",
            "not independent customer validation",
            "Wedding Reception",
            "Church Fundraiser",
            "Drop-off Event",
        )
        for copy in required:
            with self.subTest(copy=copy):
                self.assertIn(copy, text)
        self.assertNotIn(
            "3 founder-operated jobs exercised",
            text.lower(),
        )
        self.assertNotIn("Every operator", text)
        self.assertNotIn("Almost none", text)

    def test_founderrelease_is_noindex(self):
        page = parse_page(REPOSITORY_ROOT / "founderrelease.html")
        robots_values = [
            meta.get("content", "").lower()
            for meta in page.metas
            if meta.get("name", "").lower() == "robots"
        ]
        self.assertIn("noindex, nofollow", robots_values)
        canonicals = [
            attrs.get("href", "")
            for tag, attrs in page.tags
            if tag == "link" and attrs.get("rel", "").lower() == "canonical"
        ]
        self.assertIn("https://vetopsfinancial.com/founderrelease", canonicals)

    def test_yield_copy_is_configurable_not_physical_constant(self):
        required = (
            "MarginCommand starts with configurable, product-specific yield assumptions.",
            "Illustrative scenario using a 62% brisket yield assumption; not a universal yield rate.",
        )
        forbidden = (
            "physical constant",
            "Brisket is 62% yield. Pulled pork is 58%. Ribs are 45%.",
        )
        for page in MARGINCOMMAND_PAGES:
            with self.subTest(page=page.name):
                text = parse_page(page).visible_text
                for copy in required:
                    self.assertIn(copy, text)
                for copy in forbidden:
                    self.assertNotIn(copy, text)

    def test_google_copy_uses_approved_language(self):
        required = (
            "Member of the Google for Startups Cloud Program",
            "Built on Google Cloud",
        )
        for page in PROGRAM_PAGES:
            with self.subTest(page=page.name):
                text = parse_page(page).visible_text
                for copy in required:
                    self.assertIn(copy, text)
                self.assertNotIn("Powered by Google Cloud", text)

    def test_program_copy_does_not_imply_endorsement(self):
        for page in PUBLIC_PAGES:
            with self.subTest(page=page.name):
                text = parse_page(page).visible_text.lower()
                for forbidden in FORBIDDEN_PROGRAM_COPY:
                    self.assertNotIn(forbidden.lower(), text)

    def test_nvidia_badge_exists_and_is_referenced_on_both_public_pages(self):
        self.assertTrue(NVIDIA_BADGE.is_file(), f"Missing {NVIDIA_BADGE}")
        for page in PROGRAM_PAGES:
            with self.subTest(page=page.name):
                tags = parse_page(page).tags
                image_sources = [
                    attrs.get("src", "") for tag, attrs in tags if tag == "img"
                ]
                self.assertIn(NVIDIA_BADGE_URL, image_sources)
                self.assertIn(
                    "NVIDIA Inception member",
                    parse_page(page).visible_text,
                )

    def test_margincommand_video_assets_exist_under_25_mib(self):
        for video in (SHORT_COMMERCIAL_VIDEO, DEMO_VIDEO):
            with self.subTest(video=video.name):
                self.assertTrue(video.is_file(), f"Missing {video}")
                self.assertLess(
                    video.stat().st_size,
                    CLOUDFLARE_MAX_ASSET_BYTES,
                )

    def test_both_margincommand_videos_are_referenced_by_both_surfaces(self):
        for page in MARGINCOMMAND_PAGES:
            with self.subTest(page=page.name):
                sources = [
                    attrs.get("src", "")
                    for tag, attrs in parse_page(page).tags
                    if tag == "source"
                ]
                self.assertEqual(
                    [SHORT_COMMERCIAL_VIDEO_URL, DEMO_VIDEO_URL],
                    sources,
                )

    def test_both_videos_have_safe_controls_and_accessible_fallbacks(self):
        for page in MARGINCOMMAND_PAGES:
            with self.subTest(page=page.name):
                parsed = parse_page(page)
                videos = [
                    attrs
                    for tag, attrs in parsed.tags
                    if tag == "video"
                ]
                self.assertEqual(2, len(videos))
                for video in videos:
                    self.assertIn("controls", video)
                    self.assertIn("playsinline", video)
                    self.assertEqual("metadata", video.get("preload"))
                    self.assertNotIn("autoplay", video)
                    self.assertTrue(video.get("aria-label", "").strip())
                hrefs = [href for _, href in parsed.links]
                self.assertIn(SHORT_COMMERCIAL_VIDEO_URL, hrefs)
                self.assertIn(DEMO_VIDEO_URL, hrefs)
                self.assertIn(
                    ("See the Full Workflow", "#product-demo"),
                    parsed.links,
                )

    def test_margincommand_sections_follow_the_commercial_funnel(self):
        expected = [
            "hero",
            "commercial-short",
            "pain",
            "workflow",
            "yield",
            "how",
            "modules",
            "proof",
            "product-demo",
            "programs",
            "pricing",
            "pilot",
        ]
        for page in MARGINCOMMAND_PAGES:
            with self.subTest(page=page.name):
                section_ids = [
                    attrs.get("id")
                    for tag, attrs in parse_page(page).tags
                    if tag == "section" and attrs.get("id") in expected
                ]
                self.assertEqual(expected, section_ids)

    def test_margincommand_dashboards_are_explicitly_illustrative(self):
        for page in MARGINCOMMAND_PAGES:
            with self.subTest(page=page.name):
                text = parse_page(page).visible_text
                self.assertNotIn("Pipeline Value", text)
                self.assertIn("Illustrative Job Value", text)
                self.assertIn(
                    "Illustrative founder-operated workflow dashboard",
                    text,
                )
                self.assertIn(
                    "Wedding Reception · Founder-operated · 175pp",
                    text,
                )
                self.assertIn(
                    "Church Fundraiser · Founder-operated · 300pp",
                    text,
                )
                self.assertIn(
                    "Drop-off Event · Founder-operated · Bulk",
                    text,
                )

    def test_margincommand_hero_uses_ongoing_proof_without_speed_claim(self):
        for page in MARGINCOMMAND_PAGES:
            with self.subTest(page=page.name):
                text = parse_page(page).visible_text
                required = (
                    "Ongoing",
                    "Founder-operated use",
                    "Connected",
                    "Quote → Proposal",
                    "one workflow",
                    "$20",
                )
                for copy in required:
                    self.assertIn(copy, text)
                self.assertNotIn("Founder-operated jobs exercised", text)
                self.assertNotIn("60s", text)
                self.assertNotIn("~60 seconds", text)

    def test_margincommand_publishes_paid_pilot_and_standard_pricing(self):
        required = (
            "CURRENT CONTROLLED PILOT",
            "Founding Pilot",
            "$20",
            "Controlled paid beta for qualified owner-operated businesses.",
            "Credit card required upon accepted paid pilot activation.",
            "PUBLISHED STANDARD PRICING",
            "Starter",
            "$37",
            "Pro",
            "$79",
            "RECOMMENDED",
            "Pro+",
            "$149",
            "Limited availability during controlled commercialization.",
            "AI and document-processing usage allowances apply.",
            "Pilot Access Required",
        )
        forbidden = (
            "60 Days Free",
            "60 days free",
            "No card required",
            "no card required",
            "Start Free Pilot",
            "Free Pilot",
            "Try It Free",
            "Unlimited jobs",
            "Unlimited AI",
            "MOST POPULAR",
            "Most Popular",
            "live support",
            "24/7 support",
            "dedicated account manager",
            "No payment information required",
            "Buy Now",
            "Subscribe",
            "Checkout",
            "Enter Card",
            "Start Subscription",
        )
        for page in MARGINCOMMAND_PAGES:
            with self.subTest(page=page.name):
                text = parse_page(page).visible_text.replace("$ ", "$")
                for copy in required:
                    self.assertIn(copy, text)
                for copy in forbidden:
                    self.assertNotIn(copy, text)

    def test_margincommand_pricing_preserves_payment_and_ai_boundaries(self):
        required = (
            "Operator-owned payment-link workflow",
            "MarginCommand does not process payments",
            "route funds",
            "act as merchant of record",
            "AI-assisted advisory workflows",
            "AI output is advisory",
            "operator reviews and approves",
        )
        forbidden = (
            "AI automatically updates",
            "AI autonomously prices",
            "AI automatically books",
            "AI automatically changes actuals",
            "AI manages your finances",
        )
        for page in MARGINCOMMAND_PAGES:
            with self.subTest(page=page.name):
                text = parse_page(page).visible_text
                for copy in required:
                    self.assertIn(copy, text)
                for copy in forbidden:
                    self.assertNotIn(copy, text)

    def test_margincommand_labels_quote_as_public_operator_signal(self):
        quote = (
            "I did a deep dive into QuickBooks for my original location "
            "and found out my profit margins are 5%. Food cost averages "
            "39% and payroll costs 42%. We do nearly $60K in sales a "
            "month. How do I boost these margins? I can't think of the "
            "answer."
        )
        required = (
            "Public Operator Signal",
            "From public operator forums:",
            quote,
            "Fast-casual BBQ & catering operator · public forum post",
            "Public operator signal · not a MarginCommand customer or interview",
            "The problem is not simply calculating a margin. It is "
            "understanding what drove it—and what to change before the "
            "next job.",
            "Brian Penrod, DBA",
            "Founder & CEO, VetOps Financial",
            "Creator, MarginCommand",
            "Owner, Bud Wiser's BBQ LLC",
            "CSM (Ret.), U.S. Army Special Forces",
            "Doctor of Business Administration with a finance concentration",
        )
        forbidden = (
            "Customer Discovery",
            "Owner, fast-casual BBQ & catering business",
            "Customer discovery · Business identity withheld",
            "Every operator",
            "Almost none",
            "Testimonial",
            "Customer testimonial",
            "MarginCommand user",
            "Paying customer",
            "Pilot result",
            "User result",
            "Case study",
            "MarginCommand-discovered result",
        )
        for page in MARGINCOMMAND_PAGES:
            with self.subTest(page=page.name):
                text = parse_page(page).visible_text
                for copy in required:
                    self.assertIn(copy, text)
                for copy in forbidden:
                    self.assertNotIn(copy, text)

    def test_beta_login_url_remains_promoted_f5_url(self):
        for page in MARGINCOMMAND_PAGES:
            with self.subTest(page=page.name):
                links = [
                    href
                    for text, href in parse_page(page).links
                    if text == "MarginCommand Beta Login"
                ]
                self.assertTrue(links, "No customer-facing Beta Login links found")
                self.assertEqual([PROMOTED_BETA_URL] * len(links), links)

    def test_pilot_application_link_is_preserved(self):
        for page in MARGINCOMMAND_PAGES:
            with self.subTest(page=page.name):
                links = [
                    href
                    for text, href in parse_page(page).links
                    if text == "Apply for $20 Pilot"
                ]
                self.assertGreaterEqual(len(links), 2)
                self.assertEqual([PILOT_APPLICATION_URL] * len(links), links)


if __name__ == "__main__":
    unittest.main()
