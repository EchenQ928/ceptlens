import { Component, type ReactNode } from "react";
import { uiText, useLocale } from "../i18n";

class ErrorBoundaryView extends Component<{ error: Error; reset: () => void; locale: "zh-CN" | "en-US" }> {
  render() {
    const { error, reset, locale } = this.props;
    return <section className="empty-state" role="alert"><h2>{uiText(locale, "这个页面暂时无法显示", "This page cannot be displayed")}</h2><p>{uiText(locale, "教学组件运行时发生错误。可以返回目录，或更新教学包后重新加载。", "The teaching component failed at runtime. Return to the catalog or reload after updating the package.")}</p><details><summary>{uiText(locale, "错误详情", "Error details")}</summary><pre>{error.message}</pre></details><div className="error-actions"><a className="secondary-button" href="#/terms" onClick={reset}>{uiText(locale, "返回词条库", "Back to term library")}</a><button className="primary-button" onClick={() => window.location.reload()}>{uiText(locale, "重新加载", "Reload")}</button></div></section>;
  }
}

export class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state: { error: Error | null } = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (!this.state.error) return this.props.children;
    return <ErrorBoundaryLocaleView error={this.state.error} reset={() => this.setState({ error: null })} />;
  }
}

function ErrorBoundaryLocaleView({ error, reset }: { error: Error; reset: () => void }) {
  const { locale } = useLocale();
  return <ErrorBoundaryView error={error} reset={reset} locale={locale} />;
}
