import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  /** Rendered instead of the children after an error. */
  fallback: (error: Error) => ReactNode;
  children: ReactNode;
  onError?: (error: Error, info: ErrorInfo) => void;
  /** The boundary clears its error when any of these change (scene, mode...). */
  resetKeys?: readonly unknown[];
}

interface State {
  error: Error | null;
}

/**
 * Contains a failing scene so navigation keeps working. It retries when its
 * `resetKeys` change, e.g. a new scene definition or a switch to fallback.
 */
export class SceneErrorBoundary extends Component<Props, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: unknown): State {
    return { error: error instanceof Error ? error : new Error(String(error)) };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("[scene] render error", error, info.componentStack);
    this.props.onError?.(error, info);
  }

  override componentDidUpdate(prev: Props): void {
    if (!this.state.error) return;
    const a = prev.resetKeys ?? [];
    const b = this.props.resetKeys ?? [];
    if (a.length !== b.length || a.some((v, i) => !Object.is(v, b[i]))) this.setState({ error: null });
  }

  override render(): ReactNode {
    if (this.state.error) return this.props.fallback(this.state.error);
    return this.props.children;
  }
}
