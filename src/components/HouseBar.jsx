function HouseBar({ houses, activeHouse, onSelectHouse, onCreateHouse, showingFeed, onToggleFeed }) {
    return (
        <div className="house-bar">
            <div className="house-bar-top">
                <button
                    className={`house-btn global-btn ${showingFeed ? 'active' : ''}`}
                    onClick={onToggleFeed}
                    title="Media Shorts"
                    style={{ background: showingFeed ? '#ff0050' : 'var(--bg-tertiary)' }}
                >
                    <span className="house-icon"><i className='bx bx-play-circle'></i></span>
                </button>
                <div className="house-divider" style={{ background: 'var(--bg-active)' }} />

                {houses.map(house => (
                    <button
                        key={house.id}
                        className={`house-btn ${!showingFeed && activeHouse?.id === house.id ? 'active' : ''}`}
                        onClick={() => { onSelectHouse(house); }}
                        title={house.name}
                    >
                        <span className="house-icon">
                            {house.iconUrl && house.iconUrl.startsWith('bx')
                                ? <i className={'bx ' + house.iconUrl}></i>
                                : (house.iconUrl || '🏠')}
                        </span>
                    </button>
                ))}
                <div className="house-divider" />
                <button className="house-btn create-btn" onClick={onCreateHouse} title="Create a House">
                    <span className="house-icon">＋</span>
                </button>
            </div>
        </div>
    );
}

export default HouseBar;
