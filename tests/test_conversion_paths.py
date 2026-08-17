from html.parser import HTMLParser
from pathlib import Path
import unittest


REPOSITORY_ROOT = Path(__file__).resolve().parents[1]
MARGINCOMMAND_PAGES = (
    REPOSITORY_ROOT / "margincommand.html",
    REPOSITORY_ROOT / "margincommand_pilot_links_live.html",
)
PROMOTED_BETA_URL = "https://margincommand-app-e7fq2xpfwa-ue.a.run.app"


class LinkParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links = []
        self._active_link = None

    def handle_starttag(self, tag, attrs):
        if tag == "a":
            self._active_link = {
                "href": dict(attrs).get("href", ""),
                "text": [],
            }

    def handle_data(self, data):
        if self._active_link is not None:
            self._active_link["text"].append(data)

    def handle_endtag(self, tag):
        if tag == "a" and self._active_link is not None:
            self.links.append(
                (
                    " ".join("".join(self._active_link["text"]).split()),
                    self._active_link["href"],
                )
            )
            self._active_link = None


class ConversionPathTests(unittest.TestCase):
    def test_every_beta_login_opens_the_promoted_f5_application(self):
        beta_links = []

        for page in MARGINCOMMAND_PAGES:
            parser = LinkParser()
            parser.feed(page.read_text(encoding="utf-8"))
            beta_links.extend(
                (page.name, href)
                for text, href in parser.links
                if text == "MarginCommand Beta Login"
            )

        self.assertTrue(beta_links, "No customer-facing Beta Login links found")
        self.assertEqual(
            [(page, PROMOTED_BETA_URL) for page, _ in beta_links],
            beta_links,
        )


if __name__ == "__main__":
    unittest.main()
