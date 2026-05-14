import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { fetchWithToken, API_BASE, toYmd, formatSkDate } from '../../utils/adminHelpers';
import * as XLSX from 'xlsx-js-style';
import '../styles/AdminComponents.css';

const AdminReports = () => {
  const { user, token } = useAuth();
  const [reportMonth, setReportMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState('');
  const [reportData, setReportData] = useState(null);

  const loadMonthlyReport = useCallback(async () => {
    try {
      if (!user?.id) return;
      setReportLoading(true);
      setReportError('');
      setReportData(null);

      const url = `${API_BASE}/api/reports/monthly?month=${encodeURIComponent(reportMonth)}`;
      const resp = await fetchWithToken(url, token);
      const data = await resp.json();
      if (!resp.ok) {
        setReportData(null);
        setReportError(data?.error || 'Chyba pri generovaní reportu');
        return;
      }
      setReportData(data);
    } catch (err) {
      console.error(err);
      setReportData(null);
      setReportError('Chyba pri generovaní reportu');
    } finally {
      setReportLoading(false);
    }
  }, [reportMonth, token, user?.id]);

  useEffect(() => {
    loadMonthlyReport();
  }, [reportMonth, loadMonthlyReport]);

  const downloadMonthlyReportExcel = useCallback(() => {
    if (!reportData) {
      setReportError('Najprv počkajte, kým sa report načíta, potom ho môžete stiahnuť do Excelu.');
      return;
    }

    try {
      const workbook = XLSX.utils.book_new();

      const monthLabel = (() => {
        try {
          const d = new Date(`${reportMonth}-01T00:00:00`);
          if (Number.isNaN(d.getTime())) return reportMonth;
          const monthName = d.toLocaleString('sk-SK', { month: 'long' });
          const prettyMonth = monthName ? monthName.charAt(0).toUpperCase() + monthName.slice(1) : reportMonth;
          return `${prettyMonth} ${d.getFullYear()}`;
        } catch {
          return reportMonth;
        }
      })();

      const reservationsTotal = Number(reportData?.reservations?.total) || 0;
      const messagesCount = Number(reportData?.messages?.count) || 0;
      const trustCount = Number(reportData?.trustBox?.count) || 0;
      const expertCount = Number(reportData?.expertSystem?.count) || 0;

      const byDate = reportData?.reservations?.byDate || [];
      const byCategory = reportData?.trustBox?.byCategory || [];
      const expertByProblemType = reportData?.expertSystem?.byProblemType || [];

      const sessionsByDateTotal = byDate.reduce(
        (sum, row) => sum + (Number(row?.count) || 0),
        0
      );
      const trustByCategoryTotal = byCategory.reduce(
        (sum, row) => sum + (Number(row?.count) || 0),
        0
      );

      const expertByProblemTypeTotal = expertByProblemType.reduce(
        (sum, row) => sum + (Number(row?.count) || 0),
        0
      );

      const lines = [];
      lines.push(['Mesačný report', monthLabel]);
      lines.push([" "]);
      lines.push(['Súhrn']);
      lines.push(['Celkový počet dokončených sedení v mesiaci', reservationsTotal]);
      lines.push(['Celkový počet správ v mesiaci', messagesCount]);
      lines.push(['Celkový počet príspevkov v schránke dôvery', trustCount]);
      lines.push(['Použitie expertného systému', expertCount]);
      lines.push([" "]);
      lines.push(['Počet dokončených sedení podľa dátumu']);
      lines.push(['Dátum', 'Počet dokončených sedení']);
      if (byDate.length === 0) {
        lines.push(['(žiadne)', 0]);
      } else {
        byDate.forEach((row) => {
          lines.push([toYmd(row.date), Number(row.count) || 0]);
        });
      }
      lines.push(['Spolu dokončených sedení', sessionsByDateTotal]);
      lines.push([" "]);
      lines.push(['Schránka dôvery podľa typu problému']);
      lines.push(['Kategória', 'Počet']);
      if (byCategory.length === 0) {
        lines.push(['(žiadne)', 0]);
      } else {
        byCategory.forEach((row) => {
          lines.push([row.kategoria || '(bez kategórie)', Number(row.count) || 0]);
        });
      }
      lines.push(['Spolu príspevkov', trustByCategoryTotal]);
      lines.push([" "]);

      lines.push(['Použitie expertného systému podľa typu problému']);
      lines.push(['Typ problému', 'Počet']);
      if (expertByProblemType.length === 0) {
        lines.push(['(žiadne)', 0]);
      } else {
        expertByProblemType.forEach((row) => {
          lines.push([row.typ_problemu || 'Neznámy', Number(row.count) || 0]);
        });
      }
      lines.push(['Spolu použití', expertByProblemTypeTotal || expertCount]);
      lines.push([" "]);
      const sheet = XLSX.utils.aoa_to_sheet(lines);

      const thinBorder = {
        top: { style: 'thin', color: { rgb: 'CBD5E1' } },
        bottom: { style: 'thin', color: { rgb: 'CBD5E1' } },
        left: { style: 'thin', color: { rgb: 'CBD5E1' } },
        right: { style: 'thin', color: { rgb: 'CBD5E1' } }
      };

      const setCellStyle = (rowIdx, colIdx, style) => {
        const addr = XLSX.utils.encode_cell({ r: rowIdx, c: colIdx });
        const cell = sheet[addr];
        if (!cell) return;
        cell.s = { ...(cell.s || {}), ...style };
      };

      const setRowStyle = (rowIdx, style) => {
        for (let colIdx = 0; colIdx <= 1; colIdx += 1) {
          setCellStyle(rowIdx, colIdx, style);
        }
      };

      const findRowIndex = (label) => lines.findIndex((row) => row && row[0] === label);
      const isBlankRow = (row) => {
        if (!row || row.length === 0) return true;
        const a = row[0];
        const b = row[1];
        const aBlank = a === undefined || a === null || (typeof a === 'string' && a.trim() === '');
        const bBlank = b === undefined || b === null || (typeof b === 'string' && b.trim() === '');
        return aBlank && bBlank;
      };

      const titleRow = 0;
      const summaryHeaderRow = findRowIndex('Súhrn');
      const byDateSectionRow = findRowIndex('Počet dokončených sedení podľa dátumu');
      const byCategorySectionRow = findRowIndex('Schránka dôvery podľa typu problému');
      const expertByTypeSectionRow = findRowIndex('Použitie expertného systému podľa typu problému');

      setRowStyle(titleRow, {
        font: { bold: true, sz: 16, color: { rgb: '0F172A' } },
        fill: { patternType: 'solid', fgColor: { rgb: 'F8FAFC' } },
        border: thinBorder,
        alignment: { vertical: 'center' }
      });
      setCellStyle(titleRow, 0, { alignment: { horizontal: 'left', vertical: 'center' } });
      setCellStyle(titleRow, 1, { alignment: { horizontal: 'right', vertical: 'center' } });

      const sectionHeaderStyle = {
        font: { bold: true, sz: 13, color: { rgb: '0F172A' } },
        fill: { patternType: 'solid', fgColor: { rgb: 'F1F5F9' } },
        border: thinBorder,
        alignment: { horizontal: 'left', vertical: 'center' }
      };

      if (summaryHeaderRow >= 0) setRowStyle(summaryHeaderRow, sectionHeaderStyle);
      if (byDateSectionRow >= 0) setRowStyle(byDateSectionRow, sectionHeaderStyle);
      if (byCategorySectionRow >= 0) setRowStyle(byCategorySectionRow, sectionHeaderStyle);
      if (expertByTypeSectionRow >= 0) setRowStyle(expertByTypeSectionRow, sectionHeaderStyle);

      const tableHeaderStyle = {
        font: { bold: true, sz: 11, color: { rgb: 'FFFFFF' } },
        fill: { patternType: 'solid', fgColor: { rgb: '608DFD' } },
        border: thinBorder,
        alignment: { horizontal: 'center', vertical: 'center', wrapText: true }
      };

      const styleTableRegion = (startRow, endRow) => {
        for (let r = startRow; r <= endRow; r += 1) {
          for (let c = 0; c <= 1; c += 1) {
            const isNumericCol = c === 1;
            setCellStyle(r, c, {
              border: thinBorder,
              alignment: {
                vertical: 'center',
                horizontal: isNumericCol ? 'right' : 'left',
                wrapText: true
              }
            });
          }
        }
      };

      if (summaryHeaderRow >= 0) {
        const start = summaryHeaderRow + 1;
        let end = start;
        for (let r = start; r < lines.length; r += 1) {
          if (isBlankRow(lines[r])) {
            end = r - 1;
            break;
          }
          end = r;
        }
        if (end >= start) styleTableRegion(start, end);
      }

      if (byDateSectionRow >= 0) {
        const headerRow = byDateSectionRow + 1;
        setRowStyle(headerRow, tableHeaderStyle);
        const totalRow = findRowIndex('Spolu dokončených sedení');
        const start = headerRow + 1;
        const end = totalRow >= 0 ? totalRow - 1 : start - 1;
        if (end >= start) styleTableRegion(start, end);
        if (totalRow >= 0) {
          setRowStyle(totalRow, {
            font: { bold: true, sz: 11, color: { rgb: '0F172A' } },
            fill: { patternType: 'solid', fgColor: { rgb: 'ECFDF5' } },
            border: thinBorder
          });
          styleTableRegion(totalRow, totalRow);
        }
      }

      if (byCategorySectionRow >= 0) {
        const headerRow = byCategorySectionRow + 1;
        setRowStyle(headerRow, tableHeaderStyle);
        const totalRow = findRowIndex('Spolu príspevkov');
        const start = headerRow + 1;
        const end = totalRow >= 0 ? totalRow - 1 : start - 1;
        if (end >= start) styleTableRegion(start, end);
        if (totalRow >= 0) {
          setRowStyle(totalRow, {
            font: { bold: true, sz: 11, color: { rgb: '0F172A' } },
            fill: { patternType: 'solid', fgColor: { rgb: 'FFF7ED' } },
            border: thinBorder
          });
          styleTableRegion(totalRow, totalRow);
        }
      }

      if (expertByTypeSectionRow >= 0) {
        const headerRow = expertByTypeSectionRow + 1;
        setRowStyle(headerRow, tableHeaderStyle);
        const totalRow = findRowIndex('Spolu použití');
        const start = headerRow + 1;
        const end = totalRow >= 0 ? totalRow - 1 : start - 1;
        if (end >= start) styleTableRegion(start, end);
        if (totalRow >= 0) {
          setRowStyle(totalRow, {
            font: { bold: true, sz: 11, color: { rgb: '0F172A' } },
            fill: { patternType: 'solid', fgColor: { rgb: 'EFF6FF' } },
            border: thinBorder
          });
          styleTableRegion(totalRow, totalRow);
        }
      }

      sheet['!cols'] = [
        { wch: 52 },
        { wch: 24 },
      ];
      sheet['!rows'] = lines.map((row, idx) => {
        const label = Array.isArray(row) ? row[0] : '';
        const isBlank = isBlankRow(row);
        const isSection = label === 'Súhrn'
          || label === 'Počet dokončených sedení podľa dátumu'
          || label === 'Schránka dôvery podľa typu problému'
          || label === 'Použitie expertného systému podľa typu problému';
        const isHeader = label === 'Dátum' || label === 'Kategória' || label === 'Typ problému';

        if (isBlank) return { hpt: 18 };
        if (idx === 0) return { hpt: 28 };
        if (isSection) return { hpt: 22 };
        if (isHeader) return { hpt: 20 };
        return { hpt: 18 };
      });

      XLSX.utils.book_append_sheet(workbook, sheet, 'Report');

      const safeMonth = String(reportMonth || 'report').replace(/[^0-9-]/g, '');
      XLSX.writeFile(workbook, `report_${safeMonth}.xlsx`, { bookType: 'xlsx' });
    } catch (err) {
      console.error(err);
      setReportError('Chyba pri exporte do Excelu');
    }
  }, [reportData, reportMonth]);

  return (
    <div className="admin-section full-width">
      <h2>📊 Reporty a štatistiky</h2>
      <p>Report sa načíta automaticky podľa zvoleného mesiaca.</p>

      <div className="reports-toolbar">
        <label className="admin-toolbar-label">Mesiac:</label>
        <input
          type="month"
          value={reportMonth}
          onChange={(e) => setReportMonth(e.target.value)}
          className="admin-input reports-month-input"
        />
        <button
          onClick={downloadMonthlyReportExcel}
          disabled={reportLoading || !reportData}
          title={!reportData ? 'Počkajte, kým sa report načíta' : 'Stiahnuť report do Excelu'}
          className={`admin-btn admin-btn-success reports-download-btn ${reportLoading || !reportData ? 'is-disabled' : ''}`}
        >
          Stiahnuť Excel
        </button>
      </div>

      {reportError && (
        <div className="admin-alert admin-alert-error">
          {reportError}
        </div>
      )}

      {reportData && (
        <>
          <div className="stats-grid mb18">
            <div className="stat-card">
              <div className="stat-icon">🗓️</div>
              <div className="stat-info">
                <h3>{reportData?.reservations?.total ?? 0}</h3>
                <p>Počet dokončených sedení v mesiaci</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">💬</div>
              <div className="stat-info">
                <h3>{reportData?.messages?.count ?? 0}</h3>
                <p>Počet správ v mesiaci</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📬</div>
              <div className="stat-info">
                <h3>{reportData?.trustBox?.count ?? 0}</h3>
                <p>Počet príspevkov v schránke</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🤖</div>
              <div className="stat-info">
                <h3>{reportData?.expertSystem?.count ?? 0}</h3>
                <p>Počet použití expertného systému</p>
              </div>
            </div>
          </div>

          <div className="reports-grid">
            <div className="report-card">
              <div className="report-card-head">
                <h3 className="report-card-title">📅 Počet dokončených sedení podľa dátumu</h3>
              </div>
              <div className="report-card-body">
                {reportData.reservations?.byDate?.length > 0 ? (
                  <div className="admin-table-wrap">
                    <table className="report-table">
                      <thead>
                        <tr>
                          <th>Dátum</th>
                          <th>Počet dokončených sedení</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.reservations.byDate.map((row, idx) => (
                          <tr key={idx}>
                            <td>{formatSkDate(row.date)}</td>
                            <td className="num">{row.count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="report-empty">
                    <p>Žiadne sedenia v tomto mesiaci</p>
                  </div>
                )}
              </div>
            </div>

            <div className="report-card">
              <div className="report-card-head">
                <h3 className="report-card-title">💬 Schránka dôvery podľa typu problému</h3>
              </div>
              <div className="report-card-body">
                {reportData.trustBox?.byCategory?.length > 0 ? (
                  <div className="admin-table-wrap">
                    <table className="report-table">
                      <thead>
                        <tr>
                          <th>Kategória</th>
                          <th>Počet</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.trustBox.byCategory.map((row, idx) => (
                          <tr key={idx}>
                            <td>{row.kategoria || '(bez kategórie)'}</td>
                            <td className="num">{row.count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="report-empty">
                    <p>Žiadne príspevky v schránke v tomto mesiaci</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminReports;
