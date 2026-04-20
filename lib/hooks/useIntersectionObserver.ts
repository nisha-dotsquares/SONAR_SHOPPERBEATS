import { useEffect, useRef } from 'react';

export const useIntersectionObserver = ({
    target,
    onIntersect,
    threshold = 0.1,
    rootMargin = "0px",
    enabled = true,
}: {
    target: React.RefObject<Element>;
    onIntersect: () => void;
    threshold?: number;
    rootMargin?: string;
    enabled?: boolean;
}) => {
    const onIntersectRef = useRef(onIntersect);

    useEffect(() => {
        onIntersectRef.current = onIntersect;
    }, [onIntersect]);

    useEffect(() => {
        if (!enabled) {
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        onIntersectRef.current();
                    }
                });
            },
            {
                root: null,
                rootMargin,
                threshold,
            }
        );

        const el = target && target.current;

        if (!el) {
            return;
        }

        observer.observe(el);

        return () => {
            observer.unobserve(el);
        };
    }, [target, enabled, threshold, rootMargin]);
};
