import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from 'react';

interface LocationState {
  pathname: string;
  search: string;
  state: unknown;
}

interface RouterContextValue extends LocationState {
  navigate: (to: string | number, options?: { replace?: boolean; state?: unknown }) => void;
  params: Record<string, string>;
}

const RouterContext = createContext<RouterContextValue | undefined>(undefined);
const OutletContext = createContext<ReactNode>(null);

function currentLocation(state: unknown = null): LocationState {
  return {
    pathname: window.location.pathname,
    search: window.location.search,
    state
  };
}

export function BrowserRouter({ children }: { children: ReactNode }) {
  const [location, setLocation] = useState<LocationState>(() => currentLocation());

  useEffect(() => {
    const onPop = () => setLocation(currentLocation(window.history.state));
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const navigate = useCallback((to: string | number, options?: { replace?: boolean; state?: unknown }) => {
    if (typeof to === 'number') {
      window.history.go(to);
      return;
    }
    const url = to.startsWith('/') ? to : `/${to}`;
    if (options?.replace) window.history.replaceState(options.state ?? null, '', url);
    else window.history.pushState(options?.state ?? null, '', url);
    setLocation({ pathname: url.split('?')[0], search: url.includes('?') ? `?${url.split('?')[1]}` : '', state: options?.state ?? null });
  }, []);

  const value = useMemo(
    () => ({ ...location, navigate, params: {} }),
    [location, navigate]
  );

  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
}

export function useLocation() {
  const context = useRouter();
  return { pathname: context.pathname, search: context.search, state: context.state };
}

export function useNavigate() {
  return useRouter().navigate;
}

export function useParams<T extends Record<string, string>>() {
  return useRouter().params as T;
}

function useRouter() {
  const context = useContext(RouterContext);
  if (!context) throw new Error('Router hooks must be used inside BrowserRouter');
  return context;
}

function matchPath(pattern: string, pathname: string) {
  if (pattern === '*') return { params: {} as Record<string, string> };
  const patternParts = pattern.split('/').filter(Boolean);
  const pathParts = pathname.split('/').filter(Boolean);
  if (patternParts.length !== pathParts.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < patternParts.length; i += 1) {
    if (patternParts[i].startsWith(':')) params[patternParts[i].slice(1)] = decodeURIComponent(pathParts[i]);
    else if (patternParts[i] !== pathParts[i]) return null;
  }
  return { params };
}

interface RouteProps {
  path?: string;
  element?: ReactNode;
  children?: ReactNode;
}

export function Route(_props: RouteProps) {
  return null;
}

export function Routes({ children }: { children: ReactNode }) {
  const router = useRouter();
  const routes = flattenRoutes(children);

  const match =
    routes.find((route) => route.path && matchPath(route.path, router.pathname)) ||
    routes.find((route) => route.path === '*');

  if (!match) return null;
  const params = match.path ? matchPath(match.path, router.pathname)?.params || {} : {};

  return <RouterContext.Provider value={{ ...router, params }}>{match.element}</RouterContext.Provider>;
}

function nestLayouts(layouts: ReactNode[], leaf: ReactNode): ReactNode {
  return layouts.reduceRight((child, layout) => (
    <OutletContext.Provider value={child}>{layout}</OutletContext.Provider>
  ), leaf);
}

function flattenRoutes(children: ReactNode, parent?: string, layouts: ReactNode[] = []) {
  const result: { path?: string; element?: ReactNode }[] = [];
  const list = Array.isArray(children) ? children : [children];
  for (const child of list) {
    if (!child || typeof child !== 'object' || !('props' in child)) continue;
    const props = (child as { props: RouteProps }).props;
    const path = props.path
      ? props.path.startsWith('/')
        ? props.path
        : `${parent || ''}/${props.path}`.replace(/\/+/g, '/')
      : parent;
    if (props.children) {
      const nextLayouts = props.element ? [...layouts, props.element] : layouts;
      result.push(...flattenRoutes(props.children, path, nextLayouts));
    } else {
      result.push({ path, element: nestLayouts(layouts, props.element) });
    }
  }
  return result;
}

export function Outlet() {
  return <>{useContext(OutletContext)}</>;
}

export function Navigate({ to, replace, state }: { to: string; replace?: boolean; state?: unknown }) {
  const navigate = useNavigate();
  useEffect(() => {
    navigate(to, { replace, state });
  }, [navigate, replace, state, to]);
  return null;
}

export function Link({
  to,
  children,
  className,
  'aria-label': ariaLabel
}: {
  to: string;
  children: ReactNode;
  className?: string;
  'aria-label'?: string;
}) {
  const navigate = useNavigate();
  return (
    <a
      href={to}
      className={className}
      aria-label={ariaLabel}
      onClick={(event) => {
        event.preventDefault();
        navigate(to);
      }}
    >
      {children}
    </a>
  );
}

export function NavLink({
  to,
  className,
  children,
  'aria-label': ariaLabel
}: {
  to: string;
  className?: string | ((args: { isActive: boolean }) => string);
  children: ReactNode | ((args: { isActive: boolean }) => ReactNode);
  'aria-label'?: string;
}) {
  const { pathname } = useLocation();
  const isActive = pathname === to || pathname.startsWith(`${to}/`);
  const resolved = typeof className === 'function' ? className({ isActive }) : className;
  return (
    <Link to={to} className={resolved} aria-label={ariaLabel}>
      {typeof children === 'function' ? children({ isActive }) : children}
    </Link>
  );
}
