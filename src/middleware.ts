import { NextResponse, type NextRequest } from "next/server";

const USER_COOKIE = "uid";

function unauthorized() {
  return new NextResponse("Autenticação necessária", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="admin", charset="UTF-8"' },
  });
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Admin: Basic Auth (usuário "admin", senha ADMIN_PASSWORD). Sem senha configurada, admin fica bloqueado.
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    const password = process.env.ADMIN_PASSWORD;
    if (!password) return new NextResponse("Defina ADMIN_PASSWORD para usar o admin.", { status: 503 });
    const header = request.headers.get("authorization") ?? "";
    const [scheme, encoded] = header.split(" ");
    if (scheme !== "Basic" || !encoded) return unauthorized();
    const [user, pass] = atob(encoded).split(":");
    if (user !== "admin" || pass !== password) return unauthorized();
  }

  // Usuário anônimo por dispositivo.
  if (!request.cookies.get(USER_COOKIE)) {
    const id = crypto.randomUUID();
    request.cookies.set(USER_COOKIE, id);
    const response = NextResponse.next({ request: { headers: request.headers } });
    response.cookies.set(USER_COOKIE, id, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 365 * 2,
      path: "/",
    });
    return response;
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|icons/|manifest.webmanifest|sw.js|favicon.ico).*)"],
};
