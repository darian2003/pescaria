import React, { useEffect, useState } from "react";

const NUM_UMBRELE = 150;

function Beachboy() {
  const [umbrele, setUmbrele] = useState(() => {
    const salvate = localStorage.getItem("umbrele");
    let umbreleInitial = salvate
      ? JSON.parse(salvate)
      : Array.from({ length: NUM_UMBRELE }, () => ({
          stanga: { stare: 0, numarInchirieri: 0 },
          dreapta: { stare: 0, numarInchirieri: 0 },
        }));
    // Normalizează structura pentru fiecare umbrelă și șezlong
    umbreleInitial = umbreleInitial.map((u) => ({
      stanga: {
        stare: u.stanga?.stare ?? 0,
        numarInchirieri: u.stanga?.numarInchirieri ?? 0,
      },
      dreapta: {
        stare: u.dreapta?.stare ?? 0,
        numarInchirieri: u.dreapta?.numarInchirieri ?? 0,
      },
    }));
    return umbreleInitial;
  });

  useEffect(() => {
    localStorage.setItem("umbrele", JSON.stringify(umbrele));
  }, [umbrele]);

  const [modal, setModal] = useState({ deschis: false, index: null });
  const [confirmReset, setConfirmReset] = useState(false);

  const deschideModal = (index) => {
    setModal({ deschis: true, index });
  };

  const inchideModal = () => {
    setModal({ deschis: false, index: null });
  };

  const seteazaStare = (pozitie, nouaStare) => {
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

  const getCuloare = (stare) => {
    return stare === 1 ? "bg-red-500" : "bg-green-500";
  };

  const resetareZi = () => {
    setConfirmReset(false);
    const resetate = Array.from({ length: NUM_UMBRELE }, () => ({
      stanga: { stare: 0, numarInchirieri: 0 },
      dreapta: { stare: 0, numarInchirieri: 0 },
    }));
    setUmbrele(resetate);
  };

  return (
    <div className="p-4 max-w-screen-md mx-auto">
      <h1 className="text-xl font-bold text-center mb-4">Mapa Beachboy</h1>

      <div className="grid grid-cols-4 sm:grid-cols-8 md:grid-cols-10 gap-2">
        {umbrele.map((u, index) => (
          <div
            key={index}
            onClick={() => deschideModal(index)}
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-full relative cursor-pointer"
          >
            <div
              className={`absolute top-0 left-0 w-1/2 h-full rounded-l-full ${getCuloare(u.stanga.stare)}`}
            ></div>
            <div
              className={`absolute top-0 right-0 w-1/2 h-full rounded-r-full ${getCuloare(u.dreapta.stare)}`}
            ></div>
            <div className="absolute inset-0 flex items-center justify-center text-white text-2xl font-bold z-10 select-none">
              {index + 1}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 text-center">
        <button
          onClick={() => setConfirmReset(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Resetare zi
        </button>
      </div>

      {/* Modal Umbrela */}
      {modal.deschis && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-80 text-center shadow-lg">
            <h2 className="text-lg font-bold mb-4">Umbrela #{modal.index + 1}</h2>
            {["stanga", "dreapta"].map((poz) => {
              const stareCurenta = umbrele[modal.index][poz].stare;
              const numarInchirieri = umbrele[modal.index][poz].numarInchirieri;
              return (
                <div key={poz} className="mb-3">
                  <p className="font-medium mb-1">
                    Sezlong {poz === "stanga" ? "stânga" : "dreapta"}:
                    <br />
                    <span className="text-xs text-gray-500 italic">
                      Închiriat de {numarInchirieri} ori
                    </span>
                  </p>
                  <div className="flex justify-center gap-2">
                    <button
                      onClick={() => seteazaStare(poz, 0)}
                      className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
                    >
                      Liber
                    </button>
                    <button
                      onClick={() => seteazaStare(poz, 1)}
                      className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                    >
                      Ocupat
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
      )}

      {/* Confirmare reset */}
      {confirmReset && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-80 text-center shadow-lg">
            <h2 className="text-lg font-bold mb-4">Ești sigur că vrei să resetezi harta?</h2>
            <div className="flex justify-center gap-4">
              <button
                onClick={resetareZi}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Da
              </button>
              <button
                onClick={() => setConfirmReset(false)}
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

export default Beachboy;
