import { createClient } from "@/lib/supabase/server";

export async function getDashboard(month: string) {
  const supabase = await createClient();

  /*
   * =========================================================
   * 1. RANGE BULAN
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

  const {
    data: transactions,
    error
  } = await supabase
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
   * =========================================================
   */

  const {
    data: allTransactions,
    error: allTransactionsError
  } = await supabase
    .from("transactions")
    .select(
      "transaction_type, category, amount, transaction_date"
    )
    .lt("transaction_date", end);

  if (allTransactionsError) {
    throw allTransactionsError;
  }

  /*
   * =========================================================
   * 4. TABUNGAN
   * =========================================================
   */

  const {
    data: savings,
    error: savingsError
  } = await supabase
    .from("savings")
    .select("current_amount");

  if (savingsError) {
    throw savingsError;
  }

  /*
   * =========================================================
   * 5. UANG DIPINJAMKAN KE ORANG
   * =========================================================
   */

  const {
    data: loans,
    error: loansError
  } = await supabase
    .from("loans")
    .select(
      "total_amount, returned_amount"
    )
    .neq("status", "RETURNED");

  if (loansError) {
    throw loansError;
  }

  /*
   * =========================================================
   * 6. UTANG KITA
   * =========================================================
   */

  const {
    data: debts,
    error: debtsError
  } = await supabase
    .from("debts")
    .select(
      "total_amount, paid_amount"
    )
    .neq("status", "PAID");

  if (debtsError) {
    throw debtsError;
  }

  /*
   * =========================================================
   * 7. UANG MASUK
   *
   * Termasuk:
   * - Gaji
   * - Transfer Orang
   * - Pinjam dari Orang
   * - Pengembalian Pinjaman
   * =========================================================
   */

  const income = (transactions ?? [])
    .filter((transaction) => {
      if (
        transaction.transaction_type ===
        "INCOME"
      ) {
        return true;
      }

      if (
        transaction.transaction_type ===
          "LOAN" &&
        transaction.category ===
          "PENGEMBALIAN_PINJAMAN"
      ) {
        return true;
      }

      return false;
    })
    .reduce(
      (sum, transaction) =>
        sum + Number(transaction.amount),
      0
    );

  /*
   * =========================================================
   * 8. UANG KELUAR
   *
   * Termasuk:
   * - Semua EXPENSE
   * - Pinjamkan uang ke orang
   * - Bayar utang
   *
   * Catatan:
   * Pinjamkan uang tetap merupakan uang keluar
   * dari saldo, tetapi BUKAN expense untuk perhitungan
   * total aset.
   * =========================================================
   */

  const expense = (transactions ?? [])
    .filter((transaction) => {
      if (
        transaction.transaction_type ===
        "EXPENSE"
      ) {
        return true;
      }

      if (
        transaction.transaction_type ===
          "LOAN" &&
        transaction.category ===
          "PINJAMKAN_UANG"
      ) {
        return true;
      }

      return false;
    })
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
        sum +
        Number(
          savingsItem.current_amount
        ),
      0
    );

  /*
   * =========================================================
   * 10. UANG YANG MASIH DIPINJAM ORANG
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
   * 11. UTANG YANG MASIH HARUS DIBAYAR
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
   * Untuk cash flow:
   *
   * Uang masuk - uang keluar
   *
   * Pinjamkan uang dianggap uang keluar.
   * Pinjam dari orang dianggap uang masuk.
   * =========================================================
   */

  const netCashFlow =
    income - expense;

  /*
   * =========================================================
   * 13. SALDO TERSEDIA
   *
   * INCOME
   *              = +
   *
   * EXPENSE
   *              = -
   *
   * TABUNGAN_MASUK
   *              = -
   *
   * TABUNGAN_KELUAR
   *              = +
   *
   * PINJAM_DARI_ORANG
   *              = +
   *
   * PINJAMKAN_UANG
   *              = -
   *
   * PENGEMBALIAN_PINJAMAN
   *              = +
   *
   * BAYAR_UTANG
   *              = -
   * =========================================================
   */

  const available = (allTransactions ?? [])
    .reduce(
      (balance, transaction) => {
        const amount =
          Number(transaction.amount);

        /*
         * UANG MASUK
         */

        if (
          transaction.transaction_type ===
          "INCOME"
        ) {
          return balance + amount;
        }

        /*
         * UANG KELUAR
         */

        if (
          transaction.transaction_type ===
          "EXPENSE"
        ) {
          return balance - amount;
        }

        /*
         * TABUNGAN MASUK
         *
         * Uang berpindah dari saldo
         * ke tabungan.
         */

        if (
          transaction.transaction_type ===
            "TRANSFER" &&
          transaction.category ===
            "TABUNGAN_MASUK"
        ) {
          return balance - amount;
        }

        /*
         * TABUNGAN KELUAR
         *
         * Uang berpindah dari tabungan
         * ke saldo.
         */

        if (
          transaction.transaction_type ===
            "TRANSFER" &&
          transaction.category ===
            "TABUNGAN_KELUAR"
        ) {
          return balance + amount;
        }

        /*
         * KITA PINJAM UANG DARI ORANG
         *
         * Saldo bertambah.
         */

        if (
          transaction.transaction_type ===
            "INCOME" &&
          transaction.category ===
            "PINJAM_DARI_ORANG"
        ) {
          return balance + amount;
        }

        /*
         * KITA PINJAMKAN UANG KE ORANG
         *
         * Saldo berkurang.
         */

        if (
          transaction.transaction_type ===
            "LOAN" &&
          transaction.category ===
            "PINJAMKAN_UANG"
        ) {
          return balance - amount;
        }

        /*
         * ORANG MENGEMBALIKAN PINJAMAN
         *
         * Saldo bertambah.
         */

        if (
          transaction.transaction_type ===
            "LOAN" &&
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
   * + Uang dipinjam orang
   *
   * Pinjamkan uang:
   *
   * Saldo turun
   * Piutang naik
   * Total aset tetap.
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

  return {
    transactions:
      transactions ?? [],

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
