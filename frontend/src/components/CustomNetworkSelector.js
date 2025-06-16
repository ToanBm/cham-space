import { useState, useRef, useEffect } from "react";
import { CHAINS } from "../utils/chains";

function CustomNetworkSelector({ selectedChain, onSwitch }) {
    const [open, setOpen] = useState(false);
    const ref = useRef();

    const handleClickOutside = (e) => {
        if (ref.current && !ref.current.contains(e.target)) {
            setOpen(false);
        }
    };

    useEffect(() => {
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (key) => {
        setOpen(false);
        onSwitch(key);
    };

    return (
        <div className="custom-dropdown" ref={ref}>
            <div className="selected" onClick={() => setOpen(!open)}>
                <img
                    src={CHAINS[selectedChain].networkIcon}
                    alt={selectedChain}
                    className="selected-network-icon"
                />
                <span className="dropdown-arrow">▾</span>
            </div>
            {open && (
                <div className="dropdown-list">
                    {Object.entries(CHAINS).map(([key, chain]) => (
                        <div key={key} className="dropdown-item" onClick={() => handleSelect(key)}>
                            <img src={chain.networkIcon} alt={key} />
                            <span>{chain.chainName}</span>
                        </div>
                    ))}
                    <div className="dropdown-item disconnect" onClick={() => handleSelect("DISCONNECT")}>Disconnect Wallet</div>
                </div>
            )}
        </div>
    );
}

export default CustomNetworkSelector;
