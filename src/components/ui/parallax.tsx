"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Movimento editorial discreto, sem dependências:
 * - ParallaxImage: a foto rola mais devagar que a página dentro do próprio quadro.
 * - Reveal: o conteúdo sobe e aparece quando entra na tela.
 *
 * Regras: respeita `prefers-reduced-motion`; nada fica invisível sem JavaScript
 * (o estado inicial é visível e só é escondido depois de montar, se ainda estiver fora da tela).
 */

const reducedMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function ParallaxImage({
  src,
  alt,
  className,
  strength = 0.1,
  priority = false,
}: {
  src: string;
  alt: string;
  className?: string;
  /** Deslocamento máximo, em fração da altura (0.1 = 10%). */
  strength?: number;
  priority?: boolean;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const scale = 1 + strength * 2;

  useEffect(() => {
    const frame = frameRef.current;
    const img = imgRef.current;
    if (!frame || !img || reducedMotion()) return;

    let raf = 0;
    const update = () => {
      raf = 0;
      const rect = frame.getBoundingClientRect();
      const vh = window.innerHeight;
      if (rect.bottom < 0 || rect.top > vh) return;
      // -1 quando o quadro entra por baixo, 0 no centro da tela, 1 quando sai por cima.
      const progress = (vh / 2 - (rect.top + rect.height / 2)) / (vh / 2 + rect.height / 2);
      img.style.transform = `translate3d(0, ${(progress * strength * 100).toFixed(2)}%, 0) scale(${scale})`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [strength, scale]);

  return (
    <div ref={frameRef} className={cn("relative overflow-hidden bg-powder", className)}>
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : undefined}
        className="absolute inset-0 h-full w-full object-cover will-change-transform motion-reduce:!transform-none"
        style={{ transform: `scale(${scale})` }}
      />
    </div>
  );
}

export function Reveal({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"idle" | "hidden" | "shown">("idle");

  useEffect(() => {
    const el = ref.current;
    if (!el || reducedMotion()) return;
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.9) return; // já visível: não anima, não pisca

    setState("hidden");
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setState("shown");
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn(
        state !== "idle" && "transition-[opacity,transform] duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
        state === "hidden" && "translate-y-8 opacity-0",
        state === "shown" && "translate-y-0 opacity-100",
        className,
      )}
      style={state === "shown" ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
