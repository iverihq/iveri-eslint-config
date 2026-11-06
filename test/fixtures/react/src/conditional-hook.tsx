declare function useCounter(): number;

export function Counter({ visible }: { visible: boolean }): number {
    if (visible) {
        return useCounter();
    }
    return 0;
}
