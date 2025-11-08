import './ControlPanel.css';

interface ControlPanelProps {
  uniqueId: string;
  setUniqueId: (value: string) => void;
  isConnected: boolean;
  isListening: boolean;
  onStart: () => void;
  onStop: () => void;
  onClear: () => void;
}

function ControlPanel({
  uniqueId,
  setUniqueId,
  isConnected,
  isListening,
  onStart,
  onStop,
  onClear,
}: ControlPanelProps) {
  return (
    <div className="control-panel">
      <div className="control-group">
        <label htmlFor="uniqueId">UniqueId TikTok:</label>
        <input
          id="uniqueId"
          type="text"
          value={uniqueId}
          onChange={(e) => setUniqueId(e.target.value)}
          placeholder="ex: username"
          disabled={isListening}
          className="input"
        />
      </div>

      <div className="status-indicator">
        <span className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`}></span>
        <span>{isConnected ? 'Connecté' : 'Déconnecté'}</span>
      </div>

      <div className="button-group">
        <button
          onClick={onStart}
          disabled={isListening || !uniqueId.trim()}
          className="btn btn-primary"
        >
          ▶️ Démarrer
        </button>
        <button
          onClick={onStop}
          disabled={!isListening}
          className="btn btn-danger"
        >
          ⏹️ Arrêter
        </button>
        <button onClick={onClear} className="btn btn-secondary">
          🗑️ Effacer
        </button>
      </div>
    </div>
  );
}

export default ControlPanel;

