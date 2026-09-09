import { Component, type ReactNode } from "react";

export class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state: { error: Error | null } = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (!this.state.error) return this.props.children;
    return <section className="empty-state" role="alert"><h2>这个页面暂时无法显示</h2><p>教学组件运行时发生错误。可以返回目录，或更新教学包后重新加载。</p><details><summary>错误详情</summary><pre>{this.state.error.message}</pre></details><div className="error-actions"><a className="secondary-button" href="#/terms" onClick={() => this.setState({ error: null })}>返回词条库</a><button className="primary-button" onClick={() => window.location.reload()}>重新加载</button></div></section>;
  }
}
