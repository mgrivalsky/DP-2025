import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { NavigationMain } from "./navigationMain";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";

const SectionCard = ({ title, count, children }) => (
	<section
		style={{
			background: "white",
			borderRadius: "14px",
			boxShadow: "0 12px 30px rgba(0,0,0,0.08)",
			padding: "20px",
			border: "1px solid #e6ebf2",
		}}
	>
		<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
			<h2 style={{ margin: 0, fontSize: "1.2rem", color: "#1f2d3d" }}>{title}</h2>
			<span style={{ color: "#4055b5", fontWeight: 700 }}>{count}</span>
		</div>
		{children}
	</section>
);

export default function UserHistory() {
	const { user, logout } = useAuth();
	const navigate = useNavigate();
	const [sessions, setSessions] = useState([]);
	const [trustBox, setTrustBox] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	const formatDate = (value) => {
		if (!value) return "Bez dátumu";
		const d = new Date(value);
		return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString("sk-SK");
	};

	const formatStatus = (stav) => {
		if (!stav) return { label: "Čaká na potvrdenie", tone: "pending" };
		const lower = String(stav).toLowerCase();
		if (lower.includes("pending")) return { label: "Čaká na potvrdenie", tone: "pending" };
		if (lower.includes("potvrden")) return { label: "Potvrdená", tone: "ok" };
		if (lower.includes("dokonc")) return { label: "Dokončená", tone: "resolved" };
		if (lower.includes("zrus")) return { label: "Zrušená", tone: "rejected" };
		return { label: stav, tone: "pending" };
	};

	const statusStyles = {
		pending: { color: "#5c6b7a", background: "#f1f3f7" },
		ok: { color: "#0f5132", background: "#d1f1df" },
		rejected: { color: "#a02721", background: "#fdecea" },
		resolved: { color: "#0f5132", background: "#d1f1df" },
	};

	useEffect(() => {
		if (!user?.id) return;
		let active = true;

		const load = async () => {
			setLoading(true);
			setError(null);
			try {
				const [rSessions, rTrust] = await Promise.all([
					fetch(`${API_BASE}/api/reservations?userId=${user.id}`),
					fetch(`${API_BASE}/api/trust-box?userId=${user.id}`),
				]);

				if (!rSessions.ok) throw new Error("Nepodarilo sa načítať sedenia");
				if (!rTrust.ok) throw new Error("Nepodarilo sa načítať schránku dôvery");

				const sData = await rSessions.json();
				const tData = await rTrust.json();

				if (active) {
					const onlyMineSessions = (Array.isArray(sData) ? sData : []).filter(
						(s) => s.id_uzivatela === user.id || s.uzivatel_email === user.email || s.email === user.email
					);
					const onlyMineTrust = (Array.isArray(tData) ? tData : []).filter((t) => t.id_uzivatela === user.id);
					setSessions(onlyMineSessions);
					setTrustBox(onlyMineTrust);
				}
			} catch (err) {
				if (active) setError(err.message || "Chyba pri načítaní dát");
			} finally {
				if (active) setLoading(false);
			}
		};

		load();
		return () => {
			active = false;
		};
	}, [user?.id, user?.email]);

	const handleLogout = () => {
		logout();
		navigate("/login");
	};

	if (!user) return null;

	return (
		<>
			<NavigationMain />
			<div
				style={{
					paddingTop: "90px",
					minHeight: "100vh",
					background: "linear-gradient(135deg, #608dfd 0%, #5ca9fb 100%)",
					padding: "32px 16px",
				}}
			>
				<div style={{ maxWidth: "1180px", margin: "0 auto" }}>
					<header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "22px" }}>
						<div>
							<h1 style={{ margin: 0, fontSize: "2rem", color: "#1f2d3d" }}>Moja história</h1>
							<p style={{ margin: "6px 0 0", color: "#5c6b7a" }}>Tvoje sedenia a príspevky v schránke dôvery.</p>
						</div>
						<div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
							<span style={{ color: "#1f2d3d", fontWeight: 700 }}>{user.name}</span>
							<button
								onClick={handleLogout}
								style={{ padding: "8px 12px", borderRadius: "10px", border: "1px solid #dfe4ec", background: "white", cursor: "pointer", fontWeight: 600 }}
							>
								Odhlásiť sa
							</button>
						</div>
					</header>

					{loading && (
						<div
							style={{
								background: "white",
								borderRadius: "12px",
								padding: "20px",
								boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
								textAlign: "center",
							}}
						>
							Načítavam tvoje údaje...
						</div>
					)}

					{error && (
						<div style={{ background: "#fdecea", color: "#a02721", border: "1px solid #f5c6cb", borderRadius: "12px", padding: "16px", marginBottom: "16px" }}>
							{error}
						</div>
					)}

					{!loading && !error && (
							<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "22px" }}>
							<SectionCard title="Moje sedenia" count={sessions.length}>
								{sessions.length === 0 ? (
									<p style={{ color: "#6c7a89", margin: 0 }}>Zatiaľ nemáš žiadne sedenia.</p>
								) : (
									<div style={{ display: "grid", gap: "12px" }}>
										{sessions.map((s, idx) => (
											<div
												key={idx}
												style={{
													border: "1px solid #e8edf3",
													borderRadius: "12px",
													padding: "14px",
													display: "flex",
													justifyContent: "space-between",
													gap: "14px",
												}}
											>
												<div>
													<div style={{ fontWeight: 700, color: "#1f2d3d", marginBottom: "6px" }}>
														{s.uzivatel_meno && s.uzivatel_priezvisko
															? `${s.uzivatel_meno} ${s.uzivatel_priezvisko}`
															: (s.uzivatel_email || s.email || "Sedenie")}
													</div>
													<div style={{ display: "flex", gap: "10px", color: "#4d5b7c", fontSize: "0.95em" }}>
														<span>{formatDate(s.datum)}</span>
														<span>•</span>
														<span>{s.cas_od || ""}{s.cas_do ? ` - ${s.cas_do}` : ""}</span>
													</div>
												</div>
												<div style={{ textAlign: "right" }}>
													{(() => {
														const { label, tone } = formatStatus(s.stav);
														const style = statusStyles[tone] || statusStyles.ok;
														return (
															<span
																style={{
																	display: "inline-block",
																	padding: "4px 10px",
																	borderRadius: "999px",
																	fontSize: "0.85rem",
																	fontWeight: 700,
																	color: style.color,
																	background: style.background,
																}}
															>
																{label}
															</span>
														);
													})()}
													{s.psycholog_meno && (
														<div style={{ color: "#7f8c8d", fontSize: "0.85em", marginTop: "6px" }}>
															Psychológ: {s.psycholog_meno} {s.psycholog_priezvisko}
														</div>
													)}
												</div>
											</div>
										))}
									</div>
								)}
							</SectionCard>

							<SectionCard title="Moje príspevky do schránky dôvery" count={trustBox.length}>
								{trustBox.length === 0 ? (
									<p style={{ color: "#6c7a89", margin: 0 }}>Zatiaľ nemáš žiadne príspevky.</p>
								) : (
									<div style={{ display: "grid", gap: "12px" }}>
										{trustBox.map((t, idx) => (
											<div key={idx} style={{ border: "1px solid #e8edf3", borderRadius: "12px", padding: "14px", display: "grid", gap: "8px" }}>
												<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
													<div style={{ fontWeight: 700, color: "#1f2d3d" }}>{t.kategoria || "Bez kategórie"}</div>
													<div style={{ display: "flex", gap: "8px" }}>
														<span style={{ display: "inline-block", padding: "4px 10px", borderRadius: "999px", fontSize: "0.85rem", fontWeight: 700, color: "#5a3e1b", background: "#f5ebde" }}>
															{t.anonymne ? "Anonymne" : "S uvedeným menom"}
														</span>
														<span
															style={{
																display: "inline-block",
																padding: "4px 10px",
																borderRadius: "999px",
																fontSize: "0.85rem",
																fontWeight: 700,
																color: t.publikovatelne ? "#4055b5" : "#5c6b7a",
																background: t.publikovatelne ? "#e7eafe" : "#eef1f5",
															}}
														>
															{t.publikovatelne ? "Zverejniteľné" : "Nezverejniteľné"}
														</span>
													</div>
												</div>
												<div style={{ color: "#4d5b7c", fontSize: "0.97em", lineHeight: 1.6 }}>
													{t.obsah_prispevku}
												</div>
												{t.odpoved && (
													<div style={{ background: "#f4f8ff", border: "1px solid #d9e6ff", borderRadius: "10px", padding: "10px" }}>
														<div style={{ fontWeight: 700, color: "#1f2d3d", marginBottom: "4px" }}>Odpoveď psychológa</div>
														<div style={{ color: "#4d5b7c", lineHeight: 1.5 }}>{t.odpoved}</div>
													</div>
												)}
											</div>
										))}
									</div>
								)}
							</SectionCard>
						</div>
					)}
				</div>
			</div>
		</>
	);
}
