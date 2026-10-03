/**
 * Problem 1: Three ways to sum to n
 */

var sum_to_n_a = function(n) {
    // Method 1: Using a simple loop
    // Time Complexity: O(n)
    // n can be negative (spec: "any integer"). Identity S(n) = S(-n-1) for n < 0
    // (both sides equal n*(n+1)/2) reduces the negative case to a non-negative
    // loop so all three methods agree, e.g. sum_to_n_a(-5) === sum_to_n_a(4) === 10.
    if (n < 0) n = -n - 1;
    let sum = 0;
    for (let i = 1; i <= n; i++) {
        sum += i;
    }
    return sum;
};

var sum_to_n_b = function(n) {
    // Method 2: Using math formula for arithmetic series
    // Time Complexity: O(1)
    // Already consistent for negative n: n*(n+1)/2 is the closed form of the
    // same identity used in sum_to_n_a/sum_to_n_c, no special-casing needed.
    return (n * (n + 1)) / 2;
};

var sum_to_n_c = function(n) {
    // Method 3: Using Recursion
    // Time Complexity: O(n)
    // Same negative-n reduction as sum_to_n_a, so recursion terminates at n <= 1
    // instead of diverging for negative input.
    if (n < 0) return sum_to_n_c(-n - 1);
    if (n <= 1) return n;
    return n + sum_to_n_c(n - 1);
};