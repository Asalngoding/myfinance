"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { rupiah, dateIndonesia } from "@/lib/format";

type Saving = {
  id: string;
  name: string;
  target_amount: number | string | null;
  current_amount: number | string | null;
  target_date: string | null;
  description: string | null;
};

type Transaction = {
  id: string;
  transaction_type: string;
  category: string;
  amount: number | string;
  savings_id: string | null;
};

type ActionType = "SETOR" | "AMBIL";

export default function SavingsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [savings, setSavings] = useState<Saving[]>([]);
  const [availableBalance, setAvailableBalance] =
    useState(0);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showCreateModal, setShowCreateModal] =
    useState(false);

  const [showActionModal, setShowActionModal] =
    useState(false);

  const [selectedSaving, setSelectedSaving] =
    useState<Saving | null>(null);

  const [actionType, setActionType] =
    useState<ActionType>("SETOR");

  const [actionAmount, setActionAmount] =
    useState("");

  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] =
    useState("");
  const [targetDate, setTargetDate] =
    useState("");
  const [description, setDescription] =
    useState("");

  const [errorMessage, setErrorMessage] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  async function loadData() {
    try {
      setLoading(true);

      const {
        data: {
          user,
        },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const {
        data: savingsData,
        error: savingsError,
      } = await supabase
        .from("savings")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", {
          ascending: false,
        });

      if (savingsError) {
        throw savingsError;
      }

      const {
        data: transactionData,
        error: transactionError,
      } = await supabase
        .from("transactions")
        .select(
          "id, transaction_type, category, amount, savings_id"
        )
        .eq("user_id", user.id);

      if (transactionError) {
        throw transactionError;
      }

      const transactionRows =
        (transactionData as Transaction[]) || [];

      let totalIncome = 0;
      let totalExpense = 0;
      let totalSavingsIn = 0;
      let totalSavingsOut = 0;

      transactionRows.forEach(
        (transaction) => {
          const amount = Number(
            transaction.amount || 0
          );

          if (
            transaction.transaction_type ===
            "INCOME"
          ) {
            totalIncome += amount;
          }

          if (
            transaction.transaction_type ===
            "EXPENSE"
          ) {
            totalExpense += amount;
          }

          if (
            transaction.category ===
            "TABUNGAN_MASUK"
          ) {
            totalSavingsIn += amount;
          }

          if (
            transaction.category ===
            "TABUNGAN_KELUAR"
          ) {
            totalSavingsOut += amount;
          }
        }
      );

      const balance =
        totalIncome -
        totalExpense -
        totalSavingsIn +
        totalSavingsOut;

      setSavings(
        (savingsData as Saving[]) || []
      );

      setAvailableBalance(balance);
    } catch (error) {
      console.error(
        "Gagal memuat tabungan:",
        error
      );

      setErrorMessage(
        "Gagal memuat data tabungan."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function formatAmountInput(
    value: string
  ) {
    const numericValue =
      value.replace(/\D/g, "");

    if (!numericValue) {
      return "";
    }

    return new Intl.NumberFormat(
      "id-ID"
    ).format(Number(numericValue));
  }

  function getNumericValue(
    value: string
  ) {
    return Number(
      value.replace(/\./g, "").replace(/,/g, "")
    );
  }

  function closeCreateModal() {
    if (saving) return;

    setShowCreateModal(false);
    setName("");
    setTargetAmount("");
    setTargetDate("");
    setDescription("");
    setErrorMessage("");
  }

  function openActionModal(
    savingItem: Saving,
    type: ActionType
  ) {
    setSelectedSaving(savingItem);
    setActionType(type);
    setActionAmount("");
    setErrorMessage("");
    setSuccessMessage("");
    setShowActionModal(true);
  }

  function closeActionModal() {
    if (saving) return;

    setShowActionModal(false);
    setSelectedSaving(null);
    setActionAmount("");
    setErrorMessage("");
  }

  async function handleCreateSaving(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

    const numericTarget =
      getNumericValue(targetAmount);

    if (!name.trim()) {
      setErrorMessage(
        "Nama tabungan wajib diisi."
      );
      return;
    }

    if (
      !numericTarget ||
      numericTarget <= 0
    ) {
      setErrorMessage(
        "Target tabungan harus lebih dari 0."
      );
      return;
    }

    setSaving(true);

    try {
      const {
        data: {
          user,
        },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error(
          "Sesi login tidak ditemukan."
        );
      }

      const {
        error,
      } = await supabase
        .from("savings")
        .insert({
          user_id: user.id,
          name: name.trim(),
          target_amount: numericTarget,
          current_amount: 0,
          target_date:
            targetDate || null,
          description:
            description.trim() || null,
        });

      if (error) {
        throw error;
      }

      closeCreateModal();

      setSuccessMessage(
        "Target tabungan berhasil dibuat."
      );

      await loadData();

      setTimeout(() => {
        setSuccessMessage("");
      }, 1500);
    } catch (error) {
      console.error(
        "Gagal membuat tabungan:",
        error
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Gagal membuat target tabungan."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleAction(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!selectedSaving) return;

    setErrorMessage("");
    setSuccessMessage("");

    const numericAmount =
      getNumericValue(actionAmount);

    if (
      !numericAmount ||
      numericAmount <= 0
    ) {
      setErrorMessage(
        "Nominal harus lebih dari 0."
      );
      return;
    }

    const currentAmount = Number(
      selectedSaving.current_amount || 0
    );

    /*
     * SETOR TABUNGAN
     */
    if (actionType === "SETOR") {
      if (
        numericAmount >
        availableBalance
      ) {
        setErrorMessage(
          `⚠️ Saldo tidak mencukupi. Saldo tersedia ${rupiah(
            availableBalance
          )}. Maksimal setor ${rupiah(
            availableBalance
          )}.`
        );
        return;
      }
    }

    /*
     * AMBIL TABUNGAN
     */
    if (actionType === "AMBIL") {
      if (
        numericAmount >
        currentAmount
      ) {
        setErrorMessage(
          `⚠️ Saldo tabungan tidak mencukupi. Saldo tabungan ${rupiah(
            currentAmount
          )}.`
        );
        return;
      }
    }

    setSaving(true);

    try {
      const {
        data: {
          user,
        },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error(
          "Sesi login tidak ditemukan."
        );
      }

      const newCurrentAmount =
        actionType === "SETOR"
          ? currentAmount +
            numericAmount
          : currentAmount -
            numericAmount;

      /*
       * Update saldo tabungan terlebih dahulu.
       */
      const {
        error: updateError,
      } = await supabase
        .from("savings")
        .update({
          current_amount:
            newCurrentAmount,
          updated_at: new Date().toISOString(),
        })
        .eq(
          "id",
          selectedSaving.id
        )
        .eq(
          "user_id",
          user.id
        );

      if (updateError) {
        throw updateError;
      }

      /*
       * Buat transaksi yang terhubung
       * dengan tabungan.
       */
      const category =
        actionType === "SETOR"
          ? "TABUNGAN_MASUK"
          : "TABUNGAN_KELUAR";

      const transactionDescription =
        actionType === "SETOR"
          ? `Setor - ${selectedSaving.name}`
          : `Ambil - ${selectedSaving.name}`;

      const {
        error: transactionError,
      } = await supabase
        .from("transactions")
        .insert({
          user_id: user.id,
          transaction_type:
            "TRANSFER",
          category,
          amount: numericAmount,
          transaction_date:
            new Date().toISOString(),
          description:
            transactionDescription,
          savings_id:
            selectedSaving.id,
        });

      /*
       * Jika transaksi gagal,
       * kembalikan saldo tabungan.
       */
      if (transactionError) {
        await supabase
          .from("savings")
          .update({
            current_amount:
              currentAmount,
            updated_at:
              new Date().toISOString(),
          })
          .eq(
            "id",
            selectedSaving.id
          )
          .eq(
            "user_id",
            user.id
          );

        throw transactionError;
      }

      closeActionModal();

      setSuccessMessage(
        actionType === "SETOR"
          ? "Setoran tabungan berhasil disimpan."
          : "Pengambilan tabungan berhasil disimpan."
      );

      await loadData();

      setTimeout(() => {
        setSuccessMessage("");
      }, 1500);
    } catch (error) {
      console.error(
        "Gagal memproses tabungan:",
        error
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Gagal memproses transaksi tabungan."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteSaving(
    savingItem: Saving
  ) {
    const currentAmount = Number(
      savingItem.current_amount || 0
    );

    if (currentAmount > 0) {
      setErrorMessage(
        "Tabungan yang masih memiliki saldo tidak dapat dihapus."
      );
      return;
    }

    const confirmed =
      window.confirm(
        `Hapus target tabungan "${savingItem.name}"?`
      );

    if (!confirmed) return;

    setSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const {
        data: {
          user,
        },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error(
          "Sesi login tidak ditemukan."
        );
      }

      const {
        error,
      } = await supabase
        .from("savings")
        .delete()
        .eq(
          "id",
          savingItem.id
        )
        .eq(
          "user_id",
          user.id
        );

      if (error) {
        throw error;
      }

      setSuccessMessage(
        "Target tabungan berhasil dihapus."
      );

      await loadData();

      setTimeout(() => {
        setSuccessMessage("");
      }, 1500);
    } catch (error) {
      console.error(
        "Gagal menghapus tabungan:",
        error
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Gagal menghapus target tabungan."
      );
    } finally {
      setSaving(false);
    }
  }

  function getProgress(
    savingItem: Saving
  ) {
    const current = Number(
      savingItem.current_amount || 0
    );

    const target = Number(
      savingItem.target_amount || 0
    );

    if (target <= 0) return 0;

    return Math.min(
      100,
      Math.round(
        (current / target) * 100
      )
    );
  }

  function getRemaining(
    savingItem: Saving
  ) {
    const current = Number(
      savingItem.current_amount || 0
    );

    const target = Number(
      savingItem.target_amount || 0
    );

    return Math.max(
      0,
      target - current
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-sky-100 via-blue-50 to-white">
        <div className="mx-auto max-w-md px-5 pb-6 pt-5">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() =>
                router.push("/dashboard")
              }
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-xl text-slate-700 shadow-sm"
            >
              ←
            </button>

            <div className="text-center">
              <p className="text-xs font-medium text-slate-500">
                MyFinance
              </p>

              <h1 className="text-xl font-extrabold text-slate-800">
                Tabungan
              </h1>
            </div>

            <div className="h-10 w-10" />
          </div>

          {/* Saldo tersedia */}
          <div className="mt-5 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
            <p className="text-xs font-semibold text-slate-400">
              Saldo Tersedia
            </p>

            <p className="mt-1 text-2xl font-extrabold tracking-tight text-slate-800">
              {rupiah(
                availableBalance
              )}
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Saldo yang dapat digunakan untuk
              setor tabungan
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-md px-5">
        {/* Error global */}
        {errorMessage && (
          <div className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 ring-1 ring-red-100">
            {errorMessage}

            <button
              type="button"
              onClick={() =>
                setErrorMessage("")
              }
              className="ml-2 font-extrabold"
            >
              ×
            </button>
          </div>
        )}

        {/* Success */}
        {successMessage && (
          <div className="mt-4 flex items-center gap-3 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700 ring-1 ring-emerald-100">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100">
              ✓
            </span>

            <span>
              {successMessage}
            </span>
          </div>
        )}

        {/* Section title */}
        <div className="mt-6 flex items-end justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-500">
              Keuangan
            </p>

            <h2 className="mt-1 text-xl font-extrabold text-slate-800">
              Target Tabungan
            </h2>
          </div>

          <button
            type="button"
            onClick={() => {
              setErrorMessage("");
              setShowCreateModal(true);
            }}
            className="rounded-2xl bg-slate-900 px-4 py-2.5 text-xs font-extrabold text-white shadow-md transition active:scale-95"
          >
            + Buat Target
          </button>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="mt-5 rounded-3xl bg-white p-6 text-center shadow-sm ring-1 ring-slate-100">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-500" />

            <p className="mt-3 text-sm text-slate-400">
              Memuat tabungan...
            </p>
          </div>
        ) : savings.length === 0 ? (
          /* Empty state */
          <div className="mt-5 rounded-3xl bg-white p-7 text-center shadow-sm ring-1 ring-slate-100">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-3xl">
              🏦
            </div>

            <h3 className="mt-4 text-base font-extrabold text-slate-800">
              Belum ada target tabungan
            </h3>

            <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-slate-400">
              Buat target tabungan untuk mulai
              merencanakan keuanganmu.
            </p>

            <button
              type="button"
              onClick={() => {
                setErrorMessage("");
                setShowCreateModal(true);
              }}
              className="mt-5 rounded-2xl bg-blue-500 px-5 py-3 text-sm font-extrabold text-white shadow-md"
            >
              + Buat Target Tabungan
            </button>
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            {savings.map(
              (savingItem) => {
                const current =
                  Number(
                    savingItem.current_amount ||
                      0
                  );

                const target =
                  Number(
                    savingItem.target_amount ||
                      0
                  );

                const progress =
                  getProgress(
                    savingItem
                  );

                const remaining =
                  getRemaining(
                    savingItem
                  );

                const overTarget =
                  Math.max(
                    0,
                    current - target
                  );

                return (
                  <div
                    key={
                      savingItem.id
                    }
                    className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-100"
                  >
                    <div className="p-5">
                      {/* Name + menu */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="truncate text-base font-extrabold text-slate-800">
                            {
                              savingItem.name
                            }
                          </h3>

                          {savingItem.description && (
                            <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-400">
                              {
                                savingItem.description
                              }
                            </p>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            handleDeleteSaving(
                              savingItem
                            )
                          }
                          disabled={
                            saving ||
                            current > 0
                          }
                          className="shrink-0 rounded-xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-400 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Hapus
                        </button>
                      </div>

                      {/* Current / target */}
                      <div className="mt-5 flex items-end justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold text-slate-400">
                            Terkumpul
                          </p>

                          <p className="mt-1 text-xl font-extrabold text-slate-800">
                            {rupiah(
                              current
                            )}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-xs font-semibold text-slate-400">
                            Target
                          </p>

                          <p className="mt-1 text-sm font-bold text-slate-600">
                            {rupiah(
                              target
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Progress */}
                      <div className="mt-4">
                        <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-blue-500 transition-all"
                            style={{
                              width: `${progress}%`,
                            }}
                          />
                        </div>

                        <div className="mt-2 flex justify-between text-[11px] font-semibold text-slate-400">
                          <span>
                            {progress}%
                          </span>

                          {savingItem.target_date ? (
                            <span>
                              Target{" "}
                              {dateIndonesia(
                                savingItem.target_date
                              )}
                            </span>
                          ) : (
                            <span>
                              Tanpa batas waktu
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Status */}
                      {current ===
                        target &&
                        target > 0 && (
                          <div className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-700">
                            🎉 Target tabungan
                            tercapai!
                          </div>
                        )}

                      {current >
                        target &&
                        target > 0 && (
                          <div className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-700">
                            🎉 Target tabungan
                            terlampaui!
                            <span className="ml-1 font-semibold">
                              +
                              {rupiah(
                                overTarget
                              )}
                            </span>
                          </div>
                        )}

                      {current <
                        target && (
                          <div className="mt-4 rounded-2xl bg-blue-50 px-4 py-3 text-xs font-semibold text-blue-700">
                            Masih kurang{" "}
                            <span className="font-extrabold">
                              {rupiah(
                                remaining
                              )}
                            </span>{" "}
                            untuk mencapai
                            target.
                          </div>
                        )}

                      {/* Action buttons */}
                      <div className="mt-5 grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() =>
                            openActionModal(
                              savingItem,
                              "SETOR"
                            )
                          }
                          className="rounded-2xl bg-blue-500 px-4 py-3.5 text-sm font-extrabold text-white shadow-sm transition active:scale-[0.98]"
                        >
                          + Setor
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            openActionModal(
                              savingItem,
                              "AMBIL"
                            )
                          }
                          className="rounded-2xl bg-slate-100 px-4 py-3.5 text-sm font-extrabold text-slate-700 transition active:scale-[0.98]"
                        >
                          − Ambil
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }
            )}
          </div>
        )}
      </div>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto grid max-w-md grid-cols-3 px-4 py-2">
          <button
            type="button"
            onClick={() =>
              router.push("/dashboard")
            }
            className="flex flex-col items-center gap-1 rounded-2xl py-2 text-slate-400"
          >
            <span className="text-xl">
              ⌂
            </span>

            <span className="text-[10px] font-bold">
              Beranda
            </span>
          </button>

          <button
  type="button"
  onClick={() =>
    router.push("/transactions/new")
  }
  className="flex flex-col items-center rounded-2xl py-2 text-slate-400"
>
  <span className="mb-0.5 flex h-11 w-11 -translate-y-4 items-center justify-center rounded-2xl border-4 border-slate-50 bg-blue-600 text-2xl text-white shadow-lg shadow-blue-200">
    ＋
  </span>

  <span className="-mt-3 text-[10px] font-bold">
    Transaksi
  </span>
</button>
          <button
            type="button"
            className="flex flex-col items-center gap-1 rounded-2xl py-2 text-blue-500"
          >
            <span className="text-xl">
              ▣
            </span>

            <span className="text-[10px] font-extrabold">
              Tabungan
            </span>
          </button>
        </div>
      </nav>

      {/* Modal buat target */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 px-4 pb-0 backdrop-blur-sm sm:items-center sm:pb-4">
          <div className="w-full max-w-md rounded-t-[2rem] bg-white p-5 shadow-2xl sm:rounded-[2rem]">
            <div className="mx-auto mb-5 h-1.5 w-12 rounded-full bg-slate-200 sm:hidden" />

            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-blue-500">
                  Tabungan
                </p>

                <h2 className="mt-1 text-xl font-extrabold text-slate-800">
                  Buat Target
                </h2>
              </div>

              <button
                type="button"
                onClick={
                  closeCreateModal
                }
                className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-lg text-slate-500"
              >
                ×
              </button>
            </div>

            <form
              onSubmit={
                handleCreateSaving
              }
              className="mt-5 space-y-4"
            >
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Nama Tabungan
                </label>

                <input
                  type="text"
                  value={name}
                  onChange={(event) =>
                    setName(
                      event.target.value
                    )
                  }
                  placeholder="Contoh: Dana Liburan"
                  className="w-full rounded-2xl border-0 bg-slate-50 px-4 py-3.5 text-sm text-slate-700 outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Target Nominal
                </label>

                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                    Rp
                  </span>

                  <input
                    type="text"
                    inputMode="numeric"
                    value={
                      targetAmount
                    }
                    onChange={(
                      event
                    ) =>
                      setTargetAmount(
                        formatAmountInput(
                          event
                            .target
                            .value
                        )
                      )
                    }
                    placeholder="0"
                    className="w-full rounded-2xl border-0 bg-slate-50 py-3.5 pl-12 pr-4 text-sm font-bold text-slate-700 outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-400"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Target Tanggal
                  <span className="ml-1 font-normal text-slate-400">
                    (opsional)
                  </span>
                </label>

                <input
                  type="date"
                  value={
                    targetDate
                  }
                  onChange={(event) =>
                    setTargetDate(
                      event.target.value
                    )
                  }
                  className="w-full rounded-2xl border-0 bg-slate-50 px-4 py-3.5 text-sm text-slate-700 outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Keterangan
                  <span className="ml-1 font-normal text-slate-400">
                    (opsional)
                  </span>
                </label>

                <textarea
                  value={
                    description
                  }
                  onChange={(event) =>
                    setDescription(
                      event.target.value
                    )
                  }
                  rows={3}
                  placeholder="Contoh: Tabungan untuk liburan akhir tahun"
                  className="w-full resize-none rounded-2xl border-0 bg-slate-50 px-4 py-3.5 text-sm text-slate-700 outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-400"
                />
              </div>

              {errorMessage && (
                <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
                  {errorMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-2xl bg-slate-900 px-5 py-4 text-sm font-extrabold text-white shadow-lg disabled:opacity-60"
              >
                {saving
                  ? "Menyimpan..."
                  : "Buat Target Tabungan"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal setor / ambil */}
      {showActionModal &&
        selectedSaving && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 px-4 pb-0 backdrop-blur-sm sm:items-center sm:pb-4">
            <div className="w-full max-w-md rounded-t-[2rem] bg-white p-5 shadow-2xl sm:rounded-[2rem]">
              <div className="mx-auto mb-5 h-1.5 w-12 rounded-full bg-slate-200 sm:hidden" />

              <div className="flex items-center justify-between">
                <div>
                  <p
                    className={`text-xs font-semibold ${
                      actionType ===
                      "SETOR"
                        ? "text-blue-500"
                        : "text-slate-500"
                    }`}
                  >
                    {actionType ===
                    "SETOR"
                      ? "Tambah Saldo"
                      : "Gunakan Saldo"}
                  </p>

                  <h2 className="mt-1 text-xl font-extrabold text-slate-800">
                    {actionType ===
                    "SETOR"
                      ? "Setor Tabungan"
                      : "Ambil Tabungan"}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={
                    closeActionModal
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-lg text-slate-500"
                >
                  ×
                </button>
              </div>

              <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-semibold text-slate-400">
                  {selectedSaving.name}
                </p>

                <div className="mt-2 flex items-end justify-between">
                  <div>
                    <p className="text-[11px] font-semibold text-slate-400">
                      Saldo Tabungan
                    </p>

                    <p className="text-lg font-extrabold text-slate-800">
                      {rupiah(
                        Number(
                          selectedSaving.current_amount ||
                            0
                        )
                      )}
                    </p>
                  </div>

                  {actionType ===
                    "SETOR" && (
                    <div className="text-right">
                      <p className="text-[11px] font-semibold text-slate-400">
                        Saldo Tersedia
                      </p>

                      <p className="text-sm font-bold text-blue-600">
                        {rupiah(
                          availableBalance
                        )}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <form
                onSubmit={
                  handleAction
                }
                className="mt-5 space-y-4"
              >
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Nominal
                  </label>

                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                      Rp
                    </span>

                    <input
                      autoFocus
                      type="text"
                      inputMode="numeric"
                      value={
                        actionAmount
                      }
                      onChange={(
                        event
                      ) =>
                        setActionAmount(
                          formatAmountInput(
                            event
                              .target
                              .value
                          )
                        )
                      }
                      placeholder="0"
                      className="w-full rounded-2xl border-0 bg-slate-50 py-4 pl-12 pr-4 text-lg font-extrabold text-slate-800 outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                </div>

                {errorMessage && (
                  <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
                    {errorMessage}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={saving}
                  className={`w-full rounded-2xl px-5 py-4 text-sm font-extrabold text-white shadow-lg disabled:opacity-60 ${
                    actionType ===
                    "SETOR"
                      ? "bg-blue-500"
                      : "bg-slate-900"
                  }`}
                >
                  {saving
                    ? "Memproses..."
                    : actionType ===
                        "SETOR"
                      ? "Simpan Setoran"
                      : "Simpan Pengambilan"}
                </button>
              </form>
            </div>
          </div>
        )}
    </main>
  );
}
