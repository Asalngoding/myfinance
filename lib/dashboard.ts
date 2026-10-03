import { createClient } from "@/lib/supabase/server";

export async function getDashboard(month: string) {
  const supabase = await createClient();

  /*
   * =========================================================
   * 1. RANGE BULAN YANG DIPILIH
   * =========================================================
   */

  const start = `${month}-01`;

  const endDate = new Date(`${month}-01T00:00:00`);
  endDate.setMonth(endDate.getMonth() + 1);

  const end = endDate.toISOString().slice(0, 10);

  /*
   * =========================================================
   * 2. TRANSAKSI BULAN TERPILIH
   * =========================================================
   */

  const { data: transactions, error } = await supabase
    .from("transactions")
    .select("*")
    .gte("transaction_date", start)
    .lt("transaction_date", end)
    .order("transaction_date", {
      ascending: false
    })
    .order("created_at", {
      ascending: false
    });

  if (error) {
    throw error;
  }

  /*
   * =========================================================
   * 3. SEMUA TRANSAKSI SAMPAI AKHIR BULAN
   *
   * Digunakan untuk menghitung saldo tersedia.
   * Karena saldo tersedia bukan hanya transaksi bulan ini.
   * =========================================================
   */

  const { data: allTransactions, error: allTransactionsError } =
    await supabase
      .from("transactions")
      .select(
        "transaction_type, category, amount, transaction_date"
      )
      .lte("transaction_date", end);

  if (allTransactionsError) {
    throw allTransactionsError;
  }

  /*
   * =========================================================
   * 4. TABUNGAN
   * =========================================================
   */

  const { data: savings, error: savingsError } =
    await supabase
      .from("savings")
      .select("current_amount");

  if (savingsError) {
    throw savingsError;
  }

  /*
   * =========================================================
   * 5. UANG PINJAM
   * =========================================================
   */

  const { data: loans, error: loansError } =
    await supabase
      .from("loans")
      .select("total_amount, returned_amount")
      .neq("status", "RETURNED");

  if (loansError) {
    throw loansError;
  }

  /*
   * =========================================================
   * 6. UTANG
   * =========================================================
   */

  const { data: debts, error: debtsError } =
    await supabase
      .from("debts")
      .select("total_amount, paid_amount")
      .neq("status", "PAID");

  if (debtsError) {
    throw debtsError;
  }

  /*
   * =========================================================
   * 7. PEMASUKAN BULAN INI
   * =========================================================
   */

  const income = (transactions ?? [])
    .filter(
      (transaction) =>
        transaction.transaction_type === "INCOME"
    )
    .reduce(
      (sum, transaction) =>
        sum + Number(transaction.amount),
      0
    );

  /*
   * =========================================================
   * 8. PENGELUARAN BULAN INI
   * =========================================================
   */

  const expense = (transactions ?? [])
    .filter(
      (transaction) =>
        transaction.transaction_type === "EXPENSE"
    )
    .reduce(
      (sum, transaction) =>
        sum + Number(transaction.amount),
      0
    );

  /*
   * =========================================================
   * 9. TOTAL TABUNGAN
   * =========================================================
   */

  const savingsTotal = (savings ?? [])
    .reduce(
      (sum, savingsItem) =>
        sum + Number(savingsItem.current_amount),
      0
    );

  /*
   * =========================================================
   * 10. TOTAL UANG YANG MASIH DIPINJAM ORANG
   * =========================================================
   */

  const loanOutstanding = (loans ?? [])
    .reduce(
      (sum, loan) =>
        sum +
        Number(loan.total_amount) -
        Number(loan.returned_amount),
      0
    );

  /*
   * =========================================================
   * 11. TOTAL UTANG YANG BELUM DIBAYAR
   * =========================================================
   */

  const debtOutstanding = (debts ?? [])
    .reduce(
      (sum, debt) =>
        sum +
        Number(debt.total_amount) -
        Number(debt.paid_amount),
      0
    );

  /*
   * =========================================================
   * 12. NET CASH FLOW
   *
   * Sesuai definisi aplikasi:
   *
   * Pemasukan - Pengeluaran
   *
   * Transfer tabungan dan uang pinjam
   * bukan expense.
   * =========================================================
   */

  const netCashFlow = income - expense;

  /*
   * =========================================================
   * 13. SALDO TERSEDIA
   *
   * Menghitung seluruh transaksi yang benar-benar
   * memengaruhi uang cash.
   *
   * INCOME                 = +
   * EXPENSE                = -
   * TABUNGAN_MASUK         = -
   * TABUNGAN_KELUAR        = +
   * PINJAMKAN_UANG         = -
   * PENGEMBALIAN_PINJAMAN  = +
   * =========================================================
   */

  const available = (allTransactions ?? []).reduce(
    (balance, transaction) => {
      const amount = Number(transaction.amount);

      if (transaction.transaction_type === "INCOME") {
        return balance + amount;
      }

      if (transaction.transaction_type === "EXPENSE") {
        return balance - amount;
      }

      if (
        transaction.transaction_type === "TRANSFER" &&
        transaction.category === "TABUNGAN_MASUK"
      ) {
        return balance - amount;
      }

      if (
        transaction.transaction_type === "TRANSFER" &&
        transaction.category === "TABUNGAN_KELUAR"
      ) {
        return balance + amount;
      }

      if (
        transaction.transaction_type === "LOAN" &&
        transaction.category === "PINJAMKAN_UANG"
      ) {
        return balance - amount;
      }

      if (
        transaction.transaction_type === "LOAN" &&
        transaction.category ===
          "PENGEMBALIAN_PINJAMAN"
      ) {
        return balance + amount;
      }

      return balance;
    },
    0
  );

  /*
   * =========================================================
   * 14. TOTAL ASET
   *
   * Saldo tersedia
   * + Tabungan
   * + Uang yang masih dipinjam orang
   * =========================================================
   */

  const assets =
    available +
    savingsTotal +
    loanOutstanding;

  /*
   * =========================================================
   * 15. RASIO PENGELUARAN
   * =========================================================
   */

  const expenseRatio =
    income > 0
      ? (expense / income) * 100
      : 0;

  /*
   * =========================================================
   * 16. RETURN DATA DASHBOARD
   * =========================================================
   */

  return {
    transactions: transactions ?? [],

    income,
    expense,
    netCashFlow,

    available,

    savingsTotal,
    loanOutstanding,
    debtOutstanding,

    assets,

    expenseRatio
  };
}
