import React from "react";

function CustomerRoomCard({ room, fallbackImage, formatCurrency, onSelect }) {
  const handleSelect = () => {
    if (typeof onSelect === "function") {
      onSelect(room);
    }
  };

  return (
    <article
      className="customer-room-card"
      role="button"
      tabIndex={0}
      onClick={handleSelect}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          handleSelect();
        }
      }}
    >
      <div className="customer-room-media">
        <img
          src={room.image || fallbackImage}
          alt={room.name}
          onError={(event) => {
            event.currentTarget.src = fallbackImage;
          }}
        />
      </div>

      <div className="customer-room-body">
        <h3>{room.name}</h3>
        <p>{room.description}</p>

        <div className="customer-room-meta">
          <div>
            <small>From</small>
            <strong>{formatCurrency(room.price)}</strong>
            <span>/ night</span>
          </div>
          <button
            type="button"
            aria-label={`Explore ${room.name}`}
            onClick={(event) => {
              event.stopPropagation();
              handleSelect();
            }}
          >
            <i className="fa-solid fa-arrow-right"></i>
          </button>
        </div>

        <span className="customer-capacity">{room.capacity || 2} guests</span>
        {room.availableRooms !== null && (
          <span className="customer-capacity customer-capacity--availability">
            {room.availableRooms} rooms available
          </span>
        )}
      </div>
    </article>
  );
}

export default CustomerRoomCard;
