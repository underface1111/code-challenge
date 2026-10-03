// Problem 4: Three ways to sum to n

/**
 * Method 1: Using a basic for-loop
 * Time Complexity: O(n)
 * Space Complexity: O(1)
 * n can be negative (spec: "any integer"). Identity S(n) = S(-n-1) for n < 0
 * (both sides equal n*(n+1)/2) reduces the negative case to a non-negative
 * loop so all three methods agree, e.g. sum_to_n_a(-5) === sum_to_n_a(4) === 10.
 */
export function sum_to_n_a(n: number): number {
    if (n < 0) n = -n - 1;
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
 * Already consistent for negative n: n*(n+1)/2 is the closed form of the
 * same identity used in sum_to_n_a/sum_to_n_c, no special-casing needed.
 * Note: This is the most optimal method.
 */
export function sum_to_n_b(n: number): number {
    return (n * (n + 1)) / 2;
}

/**
 * Method 3: Using recursion
 * Time Complexity: O(n)
 * Space Complexity: O(n) due to the call stack
 * Same negative-n reduction as sum_to_n_a, so recursion terminates at n <= 1
 * instead of returning an inconsistent result for negative input.
 * Note: May throw a Maximum Call Stack Size Exceeded error for very large n.
 */
export function sum_to_n_c(n: number): number {
    if (n < 0) return sum_to_n_c(-n - 1);
    if (n <= 1) return n;
    return n + sum_to_n_c(n - 1);
}
