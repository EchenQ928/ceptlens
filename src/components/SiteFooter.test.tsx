// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { LocaleProvider } from "../i18n";
import { siteRegistration } from "../siteRegistration";
import { DashboardPage } from "../pages/DashboardPage";
import { SignInPage } from "../pages/SignInPage";
import { SiteFooter } from "./SiteFooter";

vi.mock("../hooks/useContent", () => ({ useContent: () => ({ questions: [], terms: [] }) }));
vi.mock("./LearningSession", () => ({ useLearningSession: () => ({ session: { authenticated: false }, refresh: vi.fn() }) }));
vi.mock("./spectral/SpectralBackdrop", () => ({ SpectralBackdrop: () => null }));
vi.mock("./spectral/VisualEnvironment", () => ({ useVisualEnvironment: () => ({ paused: true, togglePaused: vi.fn() }) }));

const originalNumber = siteRegistration.icpNumber;
afterEach(() => { siteRegistration.icpNumber = originalNumber; localStorage.clear(); });

it("shows no registration link when the website number has not been verified", () => {
  siteRegistration.icpNumber = "";
  const container = document.createElement("div");
  container.innerHTML = renderToStaticMarkup(<SiteFooter className="aura-footer"/>);
  expect(container.querySelector(".icp-registration-link")).toBeNull();
  expect(container.textContent).toContain("CeptLens");
});

for (const locale of ["en-US", "zh-CN"]) {
  it(`shows the verified website record on the visitor home and sign-in page in ${locale}`, () => {
    localStorage.setItem("ceptlens-locale", locale);
    for (const [Page, footerClass] of [[DashboardPage, "aura-footer"], [SignInPage, "welcome-footer"]] as const) {
      const container = document.createElement("div");
      container.innerHTML = renderToStaticMarkup(<LocaleProvider><MemoryRouter><Page/></MemoryRouter></LocaleProvider>);
      const links = container.querySelectorAll(`footer.${footerClass} .icp-registration-link`);
      expect(links).toHaveLength(1);
      const link = links[0];
      expect(link.textContent).toBe("沪ICP备2026048922号-1");
      expect(link.getAttribute("href")).toBe("https://beian.miit.gov.cn/");
      expect(link.getAttribute("target")).toBe("_blank");
      expect(link.getAttribute("rel")).toBe("noopener noreferrer");
      expect(link.getAttribute("lang")).toBe("zh-CN");
    }
  });
}
