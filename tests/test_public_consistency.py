from html.parser import HTMLParser
from pathlib import Path
import unittest


REPOSITORY_ROOT = Path(__file__).resolve().parents[1]
PUBLIC_PAGES = (
    REPOSITORY_ROOT / "index.html",
    REPOSITORY_ROOT / "margincommand.html",
    REPOSITORY_ROOT / "margincommand_pilot_links_live.html",
    REPOSITORY_ROOT / "founderrelease.html",
    REPOSITORY_ROOT / "studio.html",
)
MARGINCOMMAND_PAGES = (
    REPOSITORY_ROOT / "margincommand.html",
    REPOSITORY_ROOT / "margincommand_pilot_links_live.html",
)
ACTIVE_V9_PAGES = MARGINCOMMAND_PAGES
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
FINAL_DEMO_VIDEO = (
    REPOSITORY_ROOT
    / "assets/video/MarginCommand_MICRO_Website_Optimized_v9.mp4"
)
FINAL_DEMO_VIDEO_URL = (
    "https://media.vetopsfinancial.com/"
    "MarginCommand_MICRO_Website_Optimized_v9.mp4"
)
PAGES_FINAL_DEMO_VIDEO_URL = (
    "assets/video/MarginCommand_MICRO_Website_Optimized_v9.mp4"
)
RETAINED_DEMO_VIDEO = (
    REPOSITORY_ROOT
    / "assets/video/MarginCommand_Community_Dinner_Natural_Cadence_83s.mp4"
)
RETAINED_DEMO_VIDEO_URL = (
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
    def test_same_page_links_have_existing_targets(self):
        for page in PUBLIC_PAGES:
            parsed = parse_page(page)
            ids = {attrs["id"] for _, attrs in parsed.tags if attrs.get("id")}
            for _, href in parsed.links:
                if href.startswith("#") and len(href) > 1:
                    with self.subTest(page=page.name, href=href):
                        self.assertIn(href[1:], ids)

    def test_studio_exposes_finished_media_and_contact(self):
        page = REPOSITORY_ROOT / "studio.html"
        self.assertTrue(page.is_file(), "Studio page is missing")
        parsed = parse_page(page)
        self.assertIn("Your work deserves to be seen.", parsed.visible_text)
        self.assertIn("studio@vetopsfinancial.com", parsed.visible_text)
        videos = [a for t, a in parsed.tags if t == "video"]
        self.assertEqual(4, len(videos))
        for video in videos:
            self.assertIn("controls", video)
            self.assertIn("playsinline", video)
            self.assertTrue(video.get("poster"))
            self.assertNotIn("autoplay", video)
        for name in ("watch", "ring", "bbq", "plaque"):
            self.assertTrue((REPOSITORY_ROOT / f"assets/studio/{name}.mp4").is_file())
            self.assertTrue((REPOSITORY_ROOT / f"assets/studio/{name}-hd.mp4").is_file())
            self.assertTrue((REPOSITORY_ROOT / f"assets/studio/{name}.jpg").is_file())
            self.assertTrue(any(f"assets/studio/{name}-hd.mp4" in href for _, href in parsed.links))

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

    def test_homepage_presents_company_and_three_offerings(self):
        page = parse_page(REPOSITORY_ROOT / "index.html")
        for name, destination in (("VetOps Studio", "/studio"), ("MarginCommand", "/margincommand"), ("Founders Release", "/founderrelease")):
            self.assertIn(name, page.visible_text)
            self.assertIn(destination, [href for _, href in page.links])
        self.assertIn("Practical software.", page.visible_text)
        self.assertIn("Powerful digital experiences.", page.visible_text)

    def test_homepage_preserves_previous_anchor_destinations(self):
        parsed = parse_page(REPOSITORY_ROOT / "index.html")
        ids = {attrs.get("id") for _, attrs in parsed.tags}
        self.assertTrue({"hero", "margincommand", "how-it-works", "validation", "founder", "pilot", "contact"}.issubset(ids))

    def test_contact_links_use_company_addresses(self):
        for page in PUBLIC_PAGES:
            emails = [href for _, href in parse_page(page).links if href.startswith("mailto:")]
            self.assertTrue(emails, page.name)
            self.assertTrue(all("@vetopsfinancial.com" in href for href in emails), page.name)

    def test_homepage_links_to_margincommand_demo_without_loading_it(self):
        homepage = parse_page(REPOSITORY_ROOT / "index.html")
        self.assertFalse([attrs for tag, attrs in homepage.tags if tag == "video"])
        self.assertIn("/margincommand#product-demo", [href for _, href in homepage.links])

    def test_active_v9_players_use_r2_range_delivery(self):
        for page in ACTIVE_V9_PAGES:
            with self.subTest(page=page.name):
                parsed = parse_page(page)
                sources = [
                    attrs.get("src", "")
                    for tag, attrs in parsed.tags
                    if tag == "source"
                ]
                v9_sources = [
                    src
                    for src in sources
                    if src.endswith(
                        "MarginCommand_MICRO_Website_Optimized_v9.mp4"
                    )
                ]
                hrefs = [href for _, href in parsed.links]

                self.assertEqual([FINAL_DEMO_VIDEO_URL], v9_sources)
                self.assertIn(FINAL_DEMO_VIDEO_URL, hrefs)
                self.assertNotIn(PAGES_FINAL_DEMO_VIDEO_URL, sources)
                self.assertNotIn(PAGES_FINAL_DEMO_VIDEO_URL, hrefs)

    def test_all_pages_provide_shared_primary_destinations(self):
        for page in PUBLIC_PAGES:
            parsed = parse_page(page)
            hrefs = {href for _, href in parsed.links}
            self.assertTrue({"/", "/studio", "/margincommand", "/founderrelease"}.issubset(hrefs), page.name)
            current = [attrs for tag, attrs in parsed.tags if tag == "a" and attrs.get("aria-current") == "page"]
            self.assertEqual(1, len(current), page.name)

    def test_homepage_distinguishes_development_and_available_services(self):
        text = parse_page(REPOSITORY_ROOT / "index.html").visible_text
        self.assertIn("In development", text)
        self.assertIn("Controlled beta", text)
        self.assertIn("Websites", text)
        self.assertIn("Brian Penrod, DBA", text)

    def test_founderrelease_has_public_development_status_without_prices(self):
        page = parse_page(REPOSITORY_ROOT / "founderrelease.html")
        self.assertIn("In development", page.visible_text)
        self.assertIn("Pricing to be announced", page.visible_text)
        self.assertNotIn("$", page.visible_text)
        for old_offer in ("Request a Gate", "Founding Partner", "three-business-day", "Ready to Release."):
            self.assertNotIn(old_offer.lower(), page.visible_text.lower())
        robots = [meta.get("content", "").lower() for meta in page.metas if meta.get("name") == "robots"]
        self.assertNotIn("noindex, nofollow", robots)
        canonicals = [attrs.get("href") for tag, attrs in page.tags if tag == "link" and attrs.get("rel") == "canonical"]
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
        for video in (
            SHORT_COMMERCIAL_VIDEO,
            FINAL_DEMO_VIDEO,
            RETAINED_DEMO_VIDEO,
        ):
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
                    [SHORT_COMMERCIAL_VIDEO_URL, FINAL_DEMO_VIDEO_URL],
                    sources,
                )
                self.assertNotIn(RETAINED_DEMO_VIDEO_URL, sources)

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
                self.assertIn(FINAL_DEMO_VIDEO_URL, hrefs)
                self.assertNotIn(RETAINED_DEMO_VIDEO_URL, hrefs)
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
