import { siteRegistration } from "../siteRegistration";
import "./SiteFooter.css";

export function SiteFooter({ className = "" }: { className?: string }) {
  return <footer className={`site-footer ${className}`.trim()}>
    <span>CeptLens</span>
    <span>Seize understanding.</span>
    {siteRegistration.icpNumber && <a
      className="icp-registration-link"
      href="https://beian.miit.gov.cn/"
      target="_blank"
      rel="noopener noreferrer"
      lang="zh-CN"
    >{siteRegistration.icpNumber}</a>}
  </footer>;
}
