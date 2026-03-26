function Sidebar() {
    return (
        <div className="server-bar">
            <div className="server-icon active">
                {/* Using a placeholder Discord-like icon or text */}
                <span>D</span>
            </div>
            <div className="server-separator"></div>
            <div className="server-icon">
                <span style={{ color: "var(--accent-green)", fontSize: "24px" }}>+</span>
            </div>
        </div>
    );
}

export default Sidebar;
