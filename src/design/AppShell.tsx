"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/design/icons";
import { useI18n, LangToggle } from "@/design/i18n";
import { TabBar, TopBar, Scroll, Card, IconTile, Button } from "@/design/ui";
import { Home, LoyaltyCard } from "@/design/screens/AppScreens";
import { PrizesScreen } from "@/design/screens/PrizesScreen";
import { MenuScreen } from "@/design/screens/MenuScreen";
import { Reservations } from "@/design/screens/Reservations";
import { QrModal } from "@/design/screens/QrModal";
import { TIERS, tierIndexFor, type AppData, type RewardRow } from "@/design/data";
import { redeemReward } from "@/lib/app-actions";
import { signOut } from "@/lib/auth-actions";

export function AppShell({ data }: { data: AppData }) {
  const { T, L, lang, setLang } = useI18n();
  const router = useRouter();
  const [tab, setTab] = useState("home");
  const [points, setPoints] = useState(data.points);
  const [qr, setQr] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function flash(msg: string) {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2400);
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
  }

  const showTabBar = ["home", "card", "reservations", "menu", "profile"].includes(tab);

  let screen: React.ReactNode = null;
  if (tab === "home") {
    screen = <Home data={data} points={points} go={setTab} onQR={() => setQr(true)} />;
  } else if (tab === "card") {
    screen = <LoyaltyCard data={data} points={points} history={data.history} onQR={() => setQr(true)} go={setTab} />;
  } else if (tab === "rewards") {
    screen = (
      <PrizesScreen
        data={data}
        points={points}
        go={setTab}
        onRedeem={onRedeem}
        onPrizeWon={() => router.refresh()}
      />
    );
  } else if (tab === "reservations") {
    screen = (
      <Reservations
        next={data.nextReservation}
        onBooked={() => {
          flash(T("toast.bookingOk") as string);
          router.refresh();
        }}
      />
    );
  } else if (tab === "menu") {
    screen = <MenuScreen />;
  } else if (tab === "profile") {
    screen = (
      <ProfileBasic
        data={data}
        points={points}
        lang={lang}
        setLang={setLang}
        onAdmin={() => router.push("/admin")}
      />
    );
  }

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>{screen}</div>
      {showTabBar && <TabBar active={tab} onChange={setTab} />}
      {qr && <QrModal onClose={() => setQr(false)} />}
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

function ProfileBasic({
  data,
  points,
  lang,
  setLang,
  onAdmin,
}: {
  data: AppData;
  points: number;
  lang: "pt" | "en";
  setLang: (l: "pt" | "en") => void;
  onAdmin: () => void;
}) {
  const { T } = useI18n();
  const tier = TIERS[tierIndexFor(points)];
  const isStaff = data.role === "staff" || data.role === "admin";
  return (
    <>
      <TopBar title={T("prof.title") as string} right={<LangToggle value={lang} onChange={setLang} />} />
      <Scroll>
        <Card style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "color-mix(in srgb, var(--c-primary) 16%, var(--c-surface))", color: "var(--c-primary)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--f-display)", fontWeight: 800, fontSize: 22 }}>
            {data.firstName.slice(0, 1)}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "var(--f-display)", fontWeight: 800, fontSize: 18, color: "var(--c-ink)" }}>{data.nome}</div>
            <div style={{ fontFamily: "var(--f-body)", fontSize: 13, color: "var(--c-primary)", fontWeight: 700 }}>{tier.name.pt}</div>
          </div>
        </Card>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 11, marginTop: 14 }}>
          <Card pad={15} style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "var(--f-display)", fontWeight: 800, fontSize: 26, color: "var(--c-primary)" }}>{points}</div>
            <div style={{ fontFamily: "var(--f-body)", fontWeight: 700, fontSize: 12, color: "var(--c-muted)" }}>{T("prof.stat.points") as string}</div>
          </Card>
          <Card pad={15} style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "var(--f-display)", fontWeight: 800, fontSize: 26, color: "var(--c-green)" }}>{data.stamps}</div>
            <div style={{ fontFamily: "var(--f-body)", fontWeight: 700, fontSize: 12, color: "var(--c-muted)" }}>{T("prof.stat.stamps") as string}</div>
          </Card>
        </div>

        {isStaff && (
          <Card onClick={onAdmin} style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 13 }}>
            <IconTile icon="settings" accent="var(--c-ink)" size={46} />
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "var(--f-display)", fontWeight: 700, fontSize: 15, color: "var(--c-ink)" }}>{T("prof.admin") as string}</div>
              <div style={{ fontFamily: "var(--f-body)", fontSize: 12.5, color: "var(--c-muted)" }}>{T("prof.adminSub") as string}</div>
            </div>
            <Icon name="chevronRight" size={20} color="var(--c-muted)" />
          </Card>
        )}

        <form action={signOut} style={{ marginTop: 18 }}>
          <Button full variant="outline" type="submit" icon="logout">
            {T("prof.logout") as string}
          </Button>
        </form>
      </Scroll>
    </>
  );
}
