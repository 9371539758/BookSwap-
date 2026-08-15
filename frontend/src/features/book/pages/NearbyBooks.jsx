import { useEffect, useState } from "react";
import { getNearbyBooks } from "../services/book.api";
import { useAuth } from "../../auth/hooks/useAuth";
import { useChatSocket } from "../../chat/chat.context";
import "./nearby.scss";

const ownerName = (book) => book.userId?.fullName || book.userId?.username || "BookSwap reader";
const placeName = (book) => [book.location?.city, book.location?.state].filter(Boolean).join(", ") || "Location not provided";

const NearbyBooks = () => {
  const [books, setBooks] = useState([]);
  const [status, setStatus] = useState("Finding books near you...");
  const [requestState, setRequestState] = useState({});
  const { user } = useAuth();
  const { socket, isConnected } = useChatSocket();

  const loadNearbyBooks = () => {
    if (!navigator.geolocation) {
      setStatus("Your browser does not support location. Use a modern browser to find nearby books.");
      return;
    }
    setStatus("Finding books near you...");
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const nearby = await getNearbyBooks(coords.latitude, coords.longitude);
          setBooks(nearby);
          setStatus(nearby.length ? "" : "No available listings have a location yet. Ask readers to add their listing location.");
        } catch (error) {
          setStatus(error.response?.data?.message || "Could not load nearby books.");
        }
      },
      () => setStatus("Allow location access to see the books closest to you."),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  useEffect(() => { loadNearbyBooks(); }, []);

  const connectWithOwner = (book) => {
    const ownerId = book.userId?._id || book.userId;
    if (!socket || !isConnected) {
      setRequestState((current) => ({ ...current, [book._id]: "Chat is connecting. Try again in a moment." }));
      return;
    }
    setRequestState((current) => ({ ...current, [book._id]: "Sending request..." }));
    socket.emit("connection:request", { toUserId: ownerId, bookId: book._id }, (result) => {
      setRequestState((current) => ({ ...current, [book._id]: result?.ok ? "Request sent — waiting for acceptance" : result?.message || "Could not send request" }));
    });
  };

  return <main className="nearby-page"><header className="nearby-page__header"><div><p className="nearby-page__eyebrow">GET MATCHED</p><h1>Readers and books near you</h1><p>Discover available listings closest to your current location.</p></div><button onClick={loadNearbyBooks}>Refresh location</button></header>{status ? <p className="nearby-page__status">{status}</p> : <section className="nearby-page__grid">{books.map((book) => <article className="nearby-card" key={book._id}>{book.coverImage ? <img src={book.coverImage} alt={book.title} /> : <div className="nearby-card__cover">Book</div>}<div className="nearby-card__body"><span className="nearby-card__distance">{book.distanceKm < 1 ? `${Math.round(book.distanceKm * 1000)} m away` : `${book.distanceKm.toFixed(1)} km away`}</span><h2>{book.title}</h2><p>by {book.author}</p><dl><div><dt>Owner</dt><dd>{ownerName(book)}</dd></div><div><dt>Location</dt><dd>{placeName(book)}</dd></div></dl>{String(book.userId?._id || book.userId) !== String(user?._id || user?.id) && <><button className="nearby-card__connect" onClick={() => connectWithOwner(book)}>{requestState[book._id]?.startsWith("Request sent") ? "Requested" : "Connect"}</button>{requestState[book._id] && <small className="nearby-card__request">{requestState[book._id]}</small>}</>}</div></article>)}</section>}</main>;
};

export default NearbyBooks;
