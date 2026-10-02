// Problem 4: Three ways to sum to n

/**
 * Method 1: Using a basic for-loop
 * Time Complexity: O(n)
 * Space Complexity: O(1)
 */
export function sum_to_n_a(n: number): number {
    let sum = 0;
    for (let i = 1; i <= n; i++) {
        sum += i;
    }
    return sum;
}

/**
 * Method 2: Using the mathematical formula for arithmetic progression
 * Time Complexity: O(1)
 * Space Complexity: O(1)
 * Note: This is the most optimal method.
 */
export function sum_to_n_b(n: number): number {
    return (n * (n + 1)) / 2;
}

/**
 * Method 3: Using recursion
 * Time Complexity: O(n)
 * Space Complexity: O(n) due to the call stack
 * Note: May throw a Maximum Call Stack Size Exceeded error for very large n.
 */
export function sum_to_n_c(n: number): number {
    if (n <= 0) return 0;
    if (n === 1) return 1;
    return n + sum_to_n_c(n - 1);
}
