export default function FindSimilarButton({ objectId }: { objectId: string }) {
  const handleClick = () => {
    // TODO: call API to find similar objects
    console.log("Finding similar objects for:", objectId);
  };
  
  return (
    <button 
      className="btn bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded" 
      onClick={handleClick}
    >
      Find Similar
    </button>
  );
}
