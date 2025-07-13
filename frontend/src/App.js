import React, { useState, useEffect } from "react";

const NUM_UMBRELE = 150;
const PRET_SEZLONG = 40;

function App() {
  const [pagina, setPagina] = useState("mapa");
  const [umbrele, setUmbrele] = useState(
    Array.from({ length: NUM_UMBRELE }, () => ({
      stanga: { stare: 0, numarInchirieri: 0, hotel: false },
      dreapta: { stare: 0, numarInchirieri: 0, hotel: false },
    }))
  );
  const [modal, setModal] = useState({ deschis: false, index: null });
  const [rapoarte, setRapoarte] = useState(() => {
    const salvat = localStorage.getItem("rapoarteZilnice");
    return salvat ? JSON.parse(salvat) : [];
  });
  const [confirmModal, setConfirmModal] = useState({ tip: null, deschis: false });
  const [confirmStergere, setConfirmStergere] = useState({ deschis: false, index: null });

  useEffect(() => {
    localStorage.setItem("rapoarteZilnice", JSON.stringify(rapoarte));
  }, [rapoarte]);

  const deschideModal = (index) => {
    setModal({ deschis: true, index });
  };

  const inchideModal = () => {
    setModal({ deschis: false, index: null });
  };

  const seteazaStareSezlong = (pozitie, nouaStare) => {
    const updated = [...umbrele];
    const sezlong = updated[modal.index][pozitie];
    if (nouaStare === 1 && sezlong.stare === 0) {
      sezlong.numarInchirieri += 1;
      sezlong.stare = 1;
    } else if (nouaStare === 0) {
      sezlong.stare = 0;
    }
    setUmbrele(updated);
  };

  const seteazaHotel = (pozitie, valoare) => {
    const updated = [...umbrele];
    updated[modal.index][pozitie].hotel = valoare;
    if (valoare) {
      // Dacă e hotel, ocupă șezlongul
      updated[modal.index][pozitie].stare = 1;
    } else {
      // Dacă scoți hotel, pune pe liber
      updated[modal.index][pozitie].stare = 0;
    }
    setUmbrele(updated);
  };

  const getCuloareJumatate = (stare, hotel) => {
    if (hotel) return "bg-blue-500";
    return stare === 1 ? "bg-red-500" : "bg-green-500";
  };

  const totalIncasari = umbrele.reduce(
    (acc, u) =>
      acc +
      (u.stanga.hotel ? 0 : u.stanga.numarInchirieri * PRET_SEZLONG) +
      (u.dreapta.hotel ? 0 : u.dreapta.numarInchirieri * PRET_SEZLONG),
    0
  );

  const totalOcupate = umbrele.reduce(
    (acc, u) => acc + (u.stanga.stare > 0 ? 1 : 0) + (u.dreapta.stare > 0 ? 1 : 0),
    0
  );

  const totalHotel = umbrele.reduce(
    (acc, u) => acc + (u.stanga.hotel ? 1 : 0) + (u.dreapta.hotel ? 1 : 0),
    0
  );

  const confirmaActiune = (tip) => {
    setConfirmModal({ tip, deschis: true });
  };

  const executaActiune = () => {
    if (confirmModal.tip === "raport") {
      const data = new Date().toLocaleDateString("ro-RO");
      const ora = new Date().toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" });
      const raportNou = {
        data: `${data} - ${ora}`,
        ocupate: totalOcupate,
        incasari: totalIncasari,
        hoteluri: totalHotel, // <-- adăugat aici
      };
      setRapoarte([...rapoarte, raportNou]);
      resetareZi(true);
    } else if (confirmModal.tip === "reset") {
      resetareZi(true);
    }
    setConfirmModal({ tip: null, deschis: false });
  };

  const resetareZi = (faraConfirmare = false) => {
    setUmbrele(
      Array.from({ length: NUM_UMBRELE }, () => ({
        stanga: { stare: 0, numarInchirieri: 0, hotel: false },
        dreapta: { stare: 0, numarInchirieri: 0, hotel: false },
      }))
    );
  };

  const stergeToateRapoartele = () => {
    if (window.confirm("Ești sigur că vrei să ștergi toate rapoartele?")) {
      localStorage.removeItem("rapoarteZilnice");
      setRapoarte([]);
    }
  };

  // Adaugă funcția pentru ștergerea unui raport individual
  const stergeRaport = (index) => {
    const noiRapoarte = rapoarte.filter((_, i) => i !== index);
    setRapoarte(noiRapoarte);
    localStorage.setItem("rapoarteZilnice", JSON.stringify(noiRapoarte));
  };

  return (
    <div className="p-4 max-w-screen-md mx-auto">
      {/* Navbar */}
      <div className="flex justify-around mb-4">
        <button
          onClick={() => setPagina("mapa")}
          className={`px-4 py-2 rounded font-semibold ${
            pagina === "mapa" ? "bg-blue-600 text-white" : "bg-gray-200"
          }`}
        >
          Mapa sezlonguri
        </button>
        <button
          onClick={() => setPagina("rapoarte")}
          className={`px-4 py-2 rounded font-semibold ${
            pagina === "rapoarte" ? "bg-blue-600 text-white" : "bg-gray-200"
          }`}
        >
          Rapoarte zilnice
        </button>
      </div>

      {/* Pagina Mapa */}
      {pagina === "mapa" && (
        <>
          <div className="grid grid-cols-4 sm:grid-cols-8 md:grid-cols-10 gap-2">
            {umbrele.map((u, index) => (
              <div
                key={index}
                onClick={() => deschideModal(index)}
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-full relative cursor-pointer"
              >
                <div
                  className={`absolute top-0 left-0 w-1/2 h-full rounded-l-full ${getCuloareJumatate(u.stanga.stare, u.stanga.hotel)}`}
                />
                <div
                  className={`absolute top-0 right-0 w-1/2 h-full rounded-r-full ${getCuloareJumatate(u.dreapta.stare, u.dreapta.hotel)}`}
                />
                <div className="absolute inset-0 flex items-center justify-center text-white text-2xl font-bold z-10 select-none">
                  {index + 1}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-gray-100 rounded text-center shadow">
            <p className="text-lg font-semibold">Sezlonguri ocupate: {totalOcupate}</p>
            <p className="text-lg font-semibold text-green-700">Total încasări: {totalIncasari} lei</p>
            <div className="mt-4 flex justify-center gap-4">
              <button
                onClick={() => confirmaActiune("raport")}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Generează raport zilnic
              </button>
              <button
                onClick={() => confirmaActiune("reset")}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Resetare zi
              </button>
            </div>
          </div>
        </>
      )}

      {/* Pagina Rapoarte */}
      {pagina === "rapoarte" && (
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-xl font-bold mb-4">Rapoarte zilnice</h2>
          {rapoarte.length === 0 ? (
            <p className="text-gray-600">Niciun raport salvat.</p>
          ) : (
            <ul className="space-y-3">
              {rapoarte.map((r, i) => (
                <li key={i} className="border p-3 rounded bg-gray-50 flex items-center justify-between">
                  <div>
                    <p className="font-medium">📅 {r.data}</p>
                    <p>💺 Sezlonguri ocupate: {r.ocupate}</p>
                    <p>💰 Total încasări: {r.incasari} lei</p>
                    <p className="text-blue-700">🏨 Sezlonguri hotel: {r.hoteluri ?? 0}</p>
                  </div>
                  <button
                    onClick={() => setConfirmStergere({ deschis: true, index: i })}
                    className="ml-4 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                    title="Șterge acest raport"
                  >
                    Șterge
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Modal Sezlong */}
      {modal.deschis && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-80 text-center shadow-lg">
            <h2 className="text-lg font-bold mb-4">Umbrela #{modal.index + 1}</h2>
            <div className="flex flex-col gap-3">
              {["stanga", "dreapta"].map((poz) => {
                const sezlong = umbrele[modal.index][poz];
                const stareCurenta = sezlong.stare;
                const numarInchirieri = sezlong.numarInchirieri;
                const esteHotel = sezlong.hotel;

                return (
                  <div key={poz}>
                    <p className="font-medium mb-1">
                      Sezlong {poz === "stanga" ? "stânga" : "dreapta"}:
                      <br />
                      <span className="text-xs text-gray-500 italic">
                        Închiriat de {numarInchirieri} ori
                      </span>
                      {esteHotel && (
                        <span className="block text-blue-600 font-semibold text-xs mt-1">
                          Rezervat pentru hotel
                        </span>
                      )}
                    </p>
                    <div className="flex justify-center gap-2 flex-wrap">
                      <button
                        onClick={() => seteazaStareSezlong(poz, 0)}
                        className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
                      >
                        Liber
                      </button>
                      <button
                        onClick={() => seteazaStareSezlong(poz, 1)}
                        disabled={stareCurenta === 1 || esteHotel}
                        className={`px-3 py-1 rounded text-sm text-white ${
                          stareCurenta === 1 || esteHotel
                            ? "bg-red-300 cursor-not-allowed"
                            : "bg-red-500 hover:bg-red-600"
                        }`}
                      >
                        Ocupat
                      </button>
                      <button
                        onClick={() => seteazaHotel(poz, !esteHotel)}
                        className={`px-3 py-1 rounded text-sm text-white ${
                          esteHotel
                            ? "bg-blue-400 hover:bg-blue-500"
                            : "bg-blue-600 hover:bg-blue-700"
                        }`}
                      >
                        {esteHotel ? "Anulează hotel" : "Hotel"}
                      </button>
                    </div>
                  </div>
                );
              })}
              <button
                onClick={inchideModal}
                className="mt-4 text-sm text-gray-600 hover:underline"
              >
                Închide
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmare */}
      {confirmModal.deschis && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-80 text-center shadow-lg">
            <h2 className="text-lg font-bold mb-4">
              {confirmModal.tip === "raport"
                ? "Generezi raportul zilnic și resetezi harta?"
                : "Resetezi toate umbrelele?"}
            </h2>
            <div className="flex justify-center gap-4">
              <button
                onClick={executaActiune}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Da
              </button>
              <button
                onClick={() => setConfirmModal({ tip: null, deschis: false })}
                className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
              >
                Nu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmare Ștergere Raport */}
      {confirmStergere.deschis && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-80 text-center shadow-lg">
            <h2 className="text-lg font-bold mb-4">Ești sigur că vrei să ștergi acest raport?</h2>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => {
                  stergeRaport(confirmStergere.index);
                  setConfirmStergere({ deschis: false, index: null });
                }}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Da
              </button>
              <button
                onClick={() => setConfirmStergere({ deschis: false, index: null })}
                className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
              >
                Nu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
