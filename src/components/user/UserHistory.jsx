import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { NavigationMain } from "./navigationMain";
import ConfirmDialog from "../admin/ConfirmDialog";
import "../styles/UserHistory.css";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";

const SectionCard = ({ title, count, children }) => (
	<section className="user-history__card">
		<div className="user-history__cardHeader">
			<h2 className="user-history__cardTitle">{title}</h2>
			<span className="user-history__cardCount">{count}</span>
		</div>
		{children}
	</section>
);

export default function UserHistory() {
	const { user, logout, fetchWithAuth } = useAuth();
	const navigate = useNavigate();
	const [sessions, setSessions] = useState([]);
	const [trustBox, setTrustBox] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [cancelingId, setCancelingId] = useState(null);
	const [confirmDialog, setConfirmDialog] = useState({ open: false, title: "", message: "", onConfirm: null });

	const formatDate = (value) => {
		if (!value) return "Bez dátumu";
		const d = new Date(value);
		return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString("sk-SK");
	};

	const formatTime = (time) => {
		if (!time) return "";
		// If it's in HH:MM:SS format, remove seconds
		if (typeof time === "string" && time.includes(":")) {
			const parts = time.split(":");
			return parts.length > 2 ? `${parts[0]}:${parts[1]}` : time;
		}
		return time;
	};

	const formatStatus = (stav) => {
		if (!stav) return { label: "Vytvorená", tone: "vytvorena" };
		const lower = String(stav).toLowerCase();
		if (lower.includes("vytvorena")) return { label: "Vytvorená", tone: "vytvorena" };
		if (lower.includes("potvrden")) return { label: "Potvrdená", tone: "ok" };
		if (lower.includes("dokonc")) return { label: "Dokončená", tone: "resolved" };
		if (lower.includes("zrus")) return { label: "Zrušená", tone: "rejected" };
		return { label: stav, tone: "vytvorena" };
	};

	const canCancelReservation = (s) => {
		const st = String(s?.stav || '').toLowerCase();
		// Keep it simple: allow cancelling only for created/confirmed sessions.
		return st.includes('vytvorena') || st.includes('potvrden');
	};

	const performCancelReservation = async (s) => {
		try {
			const id = Number(s?.id_sedenia);
			if (!id) return;
			if (cancelingId) return;

			setError(null);
			setCancelingId(id);
			const resp = await fetchWithAuth(`${API_BASE}/api/reservations/${id}`, { method: 'DELETE' });
			const data = await resp.json().catch(() => ({}));
			if (!resp.ok) {
				throw new Error(data?.error || 'Nepodarilo sa zrušiť rezerváciu');
			}
			setSessions((prev) => (prev || []).filter((x) => Number(x?.id_sedenia) !== id));
			window.dispatchEvent(new Event('reservations:refresh-confirmed-count'));
		} catch (e) {
			setError(e?.message || 'Nepodarilo sa zrušiť rezerváciu');
		} finally {
			setCancelingId(null);
		}
	};

	const cancelReservation = (s) => {
		const id = Number(s?.id_sedenia);
		if (!id) return;
		const dateText = formatDate(s?.datum);
		const timeText = `${formatTime(s?.cas_od)}${s?.cas_do ? ` - ${formatTime(s?.cas_do)}` : ""}`;
		setConfirmDialog({
			open: true,
			title: "Zrušiť rezerváciu?",
			message: `Naozaj chcete zrušiť rezerváciu na ${dateText} (${timeText})? Rezervácia sa vymaže a termín sa znova uvoľní.`,
			onConfirm: () => {
				setConfirmDialog({ open: false, title: "", message: "", onConfirm: null });
				performCancelReservation(s);
			}
		});
	};

	useEffect(() => {
		if (!user?.id) return;
		let active = true;

		const load = async () => {
			setLoading(true);
			setError(null);
			try {
				const [rSessions, rTrust] = await Promise.all([
					fetchWithAuth(`${API_BASE}/api/reservations`),
					fetchWithAuth(`${API_BASE}/api/trust-box`),
				]);

				if (rSessions.status === 401 || rSessions.status === 403) {
					throw new Error("Nemáte prístup k sedeniam. Prihláste sa znova.");
				}
				if (rTrust.status === 401 || rTrust.status === 403) {
					throw new Error("Nemáte prístup k schránke dôvery. Prihláste sa znova.");
				}

				if (!rSessions.ok) throw new Error("Nepodarilo sa načítať sedenia");
				if (!rTrust.ok) throw new Error("Nepodarilo sa načítať schránku dôvery");

				const sData = await rSessions.json();
				const tData = await rTrust.json();

				if (active) {
					setSessions(Array.isArray(sData) ? sData : []);
					setTrustBox(Array.isArray(tData) ? tData : []);
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
	}, [user?.id, user?.email, fetchWithAuth]);

	const handleLogout = () => {
		logout();
		navigate("/login");
	};

	const markTrustItemSeen = async (id) => {
		try {
			if (!id) return;
			const resp = await fetchWithAuth(`${API_BASE}/api/trust-box/${id}/mark-seen-user`, { method: "PUT" });
			const data = await resp.json().catch(() => null);
			if (!resp.ok) {
				setError(data?.error || "Nepodarilo sa označiť správu ako videnú");
				return;
			}
			const patch = data && typeof data === "object" ? data : { videne_uzivatelom: true };
			setTrustBox((prev) => (prev || []).map((item) => (item.id_prispevku === id ? { ...item, ...patch } : item)));
			window.dispatchEvent(new Event("trustbox:refresh-unseen"));
		} catch (e) {
			setError(e?.message || "Nepodarilo sa označiť správu ako videnú");
		}
	};

	if (!user) return null;

	return (
		<>
			<NavigationMain />
			<div className="user-history__page">
				<div className="user-history__container">
					{/* <header className="user-history__header">
						<div>
							<h1 className="user-history__title">Moja história</h1>
							<p className="user-history__subtitle">Tvoje sedenia a príspevky v schránke dôvery.</p>
						</div>
						<div className="user-history__headerRight">
							<span className="user-history__userName">{user.name}</span>
							<button
								onClick={handleLogout}
								className="user-history__logoutBtn"
							>
								Odhlásiť sa
							</button>
						</div>
					</header> */}
					<br />
					<br />
					<br />
					<br />

					{loading && (
						<div className="user-history__loadingCard">
							Načítavam tvoje údaje...
						</div>
					)}

					{error && (
						<div className="user-history__error">
							{error}
						</div>
					)}

					{!loading && !error && (
							<div className="user-history__grid">
							<SectionCard title="Moje sedenia" count={sessions.length}>
								<p className="user-history__sectionInfo">
									Červené orámovanie znamená potvrdené sedenie so školským psychológom. Notifikácia vedľa mena zmizne až vtedy,
									keď psychológ označí sedenie ako dokončené/zrušené.
								</p>
								<p className="user-history__sectionInfo">
									Rezerváciu vieš zrušiť kliknutím na tlačidlo „Zrušiť“.
								</p>
								{sessions.length === 0 ? (
									<p className="user-history__empty">Zatiaľ nemáš žiadne sedenia.</p>
								) : (
									<div className="user-history__list">
										{sessions.map((s, idx) => (
											<div
												key={s.id_sedenia || idx}
												className={`user-history__itemRow${String(s?.stav || '').toLowerCase().includes('potvrden') ? ' user-history__itemRow--confirmed' : ''}`}
											>
												<div>
													<div className="user-history__itemTitle">
														{s.uzivatel_meno && s.uzivatel_priezvisko
															? `${s.uzivatel_meno} ${s.uzivatel_priezvisko}`
															: (s.uzivatel_email || s.email || "Sedenie")}
													</div>
													<div className="user-history__itemMeta">
														<span>{formatDate(s.datum)}</span>
														<span>•</span>
														<span>{formatTime(s.cas_od)}{s.cas_do ? ` - ${formatTime(s.cas_do)}` : ""}</span>
													</div>
												</div>
												<div className="user-history__itemRight">
													{(() => {
														const { label, tone } = formatStatus(s.stav);
														return (
															<span
																className={`user-history__status user-history__status--${tone}`}
															>
																{label}
															</span>
														);
													})()}
													{canCancelReservation(s) && (
														<button
															type="button"
															onClick={() => cancelReservation(s)}
															disabled={cancelingId === Number(s?.id_sedenia)}
															className="user-history__cancelBtn"
														>
															{cancelingId === Number(s?.id_sedenia) ? 'Ruším...' : 'Zrušiť'}
														</button>
													)}
													{s.psycholog_meno && (
														<div className="user-history__psycholog">
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
								<p className="user-history__sectionInfo">
									Po odoslaní príspevku ho psychológ spracuje a môže pridať odpoveď. Keď sa objaví odpoveď, zobrazí sa
									ikona oka (👁️) — kliknutím označíš odpoveď ako videnú a tým sa odstráni notifikácia vedľa mena. Tagy pri
									príspevku ukazujú, či je anonymný a či je zverejnený.
								</p>
								{trustBox.length === 0 ? (
									<p className="user-history__empty">Zatiaľ nemáš žiadne príspevky.</p>
								) : (
									<div className="user-history__list">
										{trustBox.map((t, idx) => (
											<div key={idx} className="user-history__trustItem">
												<div className="user-history__trustHeader">
													<div className="user-history__trustCategory">{t.kategoria || "Bez kategórie"}</div>
													<div className="user-history__trustBadges">
														{t.odpoved && !(t.videne_uzivatelom === true) && (
															<button
																type="button"
																onClick={() => markTrustItemSeen(t.id_prispevku)}
																className="user-history__trustSeenBtn"
																title="Označiť odpoveď ako videnú"
															>
																👁️
															</button>
														)}
														<span className="user-history__badge user-history__badge--anonymous">
															{t.anonymne ? "Anonymne" : "S uvedeným menom"}
														</span>
														<span
																className={`user-history__badge ${t.zverejnene ? "user-history__badge--publishable" : "user-history__badge--notPublishable"}`}
														>
																{t.zverejnene ? "Zverejnené" : "Nezverejnené"}
														</span>
													</div>
												</div>
												<div className="user-history__trustText">
													{t.obsah_prispevku}
												</div>
												{t.odpoved && (
													<div className="user-history__trustAnswer">
														<div className="user-history__trustAnswerTitle">Odpoveď psychológa</div>
														<div className="user-history__trustAnswerText">{t.odpoved}</div>
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
			<ConfirmDialog
				open={confirmDialog.open}
				title={confirmDialog.title}
				message={confirmDialog.message}
				confirmText="Áno, zrušiť"
				cancelText="Späť"
				confirmDanger={true}
				dismissOnOverlayClick={true}
				onConfirm={confirmDialog.onConfirm}
				onCancel={() => setConfirmDialog({ open: false, title: "", message: "", onConfirm: null })}
			/>
		</>
	);
}
