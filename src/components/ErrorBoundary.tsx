import { Component, type ReactNode } from "react";
import type { Locale } from "../domain/content";
import { uiText, useLocale } from "../i18n";

class ErrorBoundaryView extends Component<{ children: ReactNode; locale: Locale }, { error: Error | null }> {
  state: { error: Error | null } = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (!this.state.error) return this.props.children;
    const { locale } = this.props;
    return <section className="empty-state" role="alert"><h2>{uiText(locale, "这个页面暂时无法显示", "This page cannot be displayed")}</h2><p>{uiText(locale, "教学组件运行时发生错误。可以返回目录，或更新教学包后重新加载。", "The teaching component failed at runtime. Return to the catalog or reload after updating the package.")}</p><details><summary>{uiText(locale, "错误详情", "Error details")}</summary><pre>{this.state.error.message}</pre></details><div className="error-actions"><a className="secondary-button" href="#/terms" onClick={() => this.setState({ error: null })}>{uiText(locale, "返回词条库", "Back to term library")}</a><button className="primary-button" onClick={() => window.location.reload()}>{uiText(locale, "重新加载", "Reload")}</button></div></section>;
  }
}

export function ErrorBoundary({ children }: { children: ReactNode }) {
  const { locale } = useLocale();
  return <ErrorBoundaryView locale={locale}>{children}</ErrorBoundaryView>;
}
