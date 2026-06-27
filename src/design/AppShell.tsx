"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/design/i18n";
import { TabBar } from "@/design/ui";
import { Home, LoyaltyCard } from "@/design/screens/AppScreens";
import { PrizesScreen } from "@/design/screens/PrizesScreen";
import { MenuScreen } from "@/design/screens/MenuScreen";
import { Reservations } from "@/design/screens/Reservations";
import { Profile, EditProfile } from "@/design/screens/Profile";
import { QrModal } from "@/design/screens/QrModal";
import { NotificationsSheet } from "@/design/screens/NotificationsSheet";
import { type AppData, type RewardRow, type MenuCatRow, type FoodCategory } from "@/design/data";
import { redeemReward, reclamarLoginDiario } from "@/lib/app-actions";
import { marcarNotificacoesLidas } from "@/lib/notif-actions";

export function AppShell({ data, menu, foodCategories = [] }: { data: AppData; menu?: MenuCatRow[]; foodCategories?: FoodCategory[] }) {
  const { T, L, lang, setLang } = useI18n();
  const router = useRouter();
  const [tab, setTab] = useState("home");
  const [points, setPoints] = useState(data.points);
  const [qr, setQr] = useState(false);
  const [notif, setNotif] = useState(false);
  const [editing, setEditing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function flash(msg: string) {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2400);
  }

  // Bónus de registo (+150, 1ª vez). O login diário já NÃO dá pontos.
  useEffect(() => {
    let alive = true;
    reclamarLoginDiario().then((r) => {
      if (!alive || !r.signup) return;
      flash("Bem-vindo! +150 pontos 🎉");
      router.refresh();
    });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function goTab(t: string) {
    setEditing(false);
    setTab(t);
  }

  // Abrir notificações = marcá-las como lidas já (o sinal vermelho limpa na hora),
  // depois revalida para o servidor refletir o estado.
  function openNotif() {
    setNotif(true);
    if (data.unread > 0) void marcarNotificacoesLidas().then(() => router.refresh());
  }

  async function onRedeem(r: RewardRow) {
    if (points < r.custo_pontos) return;
    const res = await redeemReward(r.id);
    if (res.error) {
      flash(res.error);
      return;
    }
    setPoints((p) => p - r.custo_pontos);
    flash(T("toast.redeem", L({ pt: r.titulo, en: r.nome_en || r.titulo })) as string);
    router.refresh();
  }

  const showTabBar = ["home", "card", "reservations", "menu", "profile"].includes(tab);

  let screen: React.ReactNode = null;
  if (tab === "home") {
    screen = <Home data={data} points={points} go={goTab} onQR={() => setQr(true)} onBell={openNotif} />;
  } else if (tab === "card") {
    screen = <LoyaltyCard data={data} points={points} history={data.history} onQR={() => setQr(true)} go={goTab} />;
  } else if (tab === "rewards") {
    screen = <PrizesScreen data={data} points={points} go={goTab} onRedeem={onRedeem} onPrizeWon={() => router.refresh()} />;
  } else if (tab === "reservations") {
    screen = (
      <Reservations
        mine={data.reservations}
        blocked={data.reservasBloqueadas}
        onBooked={() => {
          flash(T("toast.bookingOk") as string);
          router.refresh();
        }}
      />
    );
  } else if (tab === "menu") {
    screen = <MenuScreen menu={menu} />;
  } else if (tab === "profile") {
    screen = editing ? (
      <EditProfile
        data={data}
        foodCategories={foodCategories}
        onBack={() => setEditing(false)}
        onSaved={() => {
          flash(T("edit.saved") as string);
          router.refresh();
        }}
      />
    ) : (
      <Profile
        data={data}
        lang={lang}
        setLang={setLang}
        onEdit={() => setEditing(true)}
        onAdmin={() => router.push("/admin")}
      />
    );
  }

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>{screen}</div>
      {showTabBar && <TabBar active={tab} onChange={goTab} />}
      {qr && <QrModal onClose={() => setQr(false)} />}
      {notif && (
        <NotificationsSheet data={data} onClose={() => setNotif(false)} />
      )}
      {toast && (
        <div
          style={{
            position: "absolute",
            bottom: 92,
            left: "50%",
            zIndex: 90,
            transform: "translateX(-50%)",
            padding: "12px 20px",
            borderRadius: 14,
            background: "var(--c-ink)",
            color: "#fff",
            fontFamily: "var(--f-display)",
            fontWeight: 700,
            fontSize: 14,
            whiteSpace: "nowrap",
            boxShadow: "0 12px 30px -8px rgba(0,0,0,0.4)",
            animation: "toastIn .25s ease",
          }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}
