import React, { useMemo } from 'react';

// Added blockchain property which was missing in the original WalletBalance interface
interface WalletBalance {
  currency: string;
  amount: number;
  blockchain: string; 
}

interface FormattedWalletBalance extends WalletBalance {
  formatted: string;
}

interface Props extends BoxProps {}

// 1. Actually moved outside the component (previously declared inside, so a
//    new object/function was allocated on every render despite the comment
//    claiming otherwise) since neither depends on props or state.
// 2. Changed parameter type from `any` to `string` (or a specific type like 'Osmosis' | 'Ethereum' etc).
// 3. Replaced switch-case with a Record (hash map) for better performance and readability O(1) lookup.
const blockchainPriorities: Record<string, number> = {
  Osmosis: 100,
  Ethereum: 50,
  Arbitrum: 30,
  Zilliqa: 20,
  Neo: 20,
};

const getPriority = (blockchain: string): number => {
  return blockchainPriorities[blockchain] ?? -99;
};

const WalletPage: React.FC<Props> = (props: Props) => {
  const { children, ...rest } = props;
  const balances = useWalletBalances();
  const prices = usePrices();

  const formattedBalances = useMemo(() => {
    return balances
      .filter((balance: WalletBalance) => {
        // 4. Fixed variable name from `lhsPriority` to `balancePriority`.
        const balancePriority = getPriority(balance.blockchain);
        
        // 5. Fixed logic bug: Previously it retained zero/negative balances (amount <= 0). 
        // It should keep positive balances (amount > 0).
        return balancePriority > -99 && balance.amount > 0;
      })
      .sort((lhs: WalletBalance, rhs: WalletBalance) => {
        // 6. Optimized sort comparison.
        const leftPriority = getPriority(lhs.blockchain);
        const rightPriority = getPriority(rhs.blockchain);
        return rightPriority - leftPriority;
      })
      .map((balance: WalletBalance) => ({
        // 7. Combined mapping and formatting into the same useMemo to prevent unnecessary loops.
        //    This also fixes a runtime bug in the original: `rows` was built from
        //    `sortedBalances` (typed as WalletBalance, no `.formatted` field) while the
        //    properly computed `formattedBalances` was never used, so `balance.formatted`
        //    was `undefined` at render time. `rows` below now correctly reads from this array.
        ...balance,
        formatted: balance.amount.toFixed(2) // 8. Passed a specific decimal place to toFixed
      }));
  }, [balances]); // 9. Removed `prices` from dependency array as it is not used in filtering/sorting.

  const rows = formattedBalances.map((balance: FormattedWalletBalance) => {
    // 10. Handled case where price might be undefined.
    const price = prices[balance.currency] || 0;
    const usdValue = price * balance.amount;

    return (
      <WalletRow
        className={classes.row}
        // 11. Used a stable key instead of index to prevent re-rendering issues when array shifts.
        //     Composite of blockchain+currency (not currency alone) since the same currency
        //     symbol can legitimately appear once per chain (e.g. USDC on both Ethereum and Arbitrum).
        key={`${balance.blockchain}-${balance.currency}`}
        amount={balance.amount}
        usdValue={usdValue}
        formattedAmount={balance.formatted}
      />
    );
  });

  return (
    <div {...rest}>
      {rows}
    </div>
  );
};
