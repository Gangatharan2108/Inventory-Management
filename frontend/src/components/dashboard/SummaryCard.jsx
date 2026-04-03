const SummaryCard = ({ title, value, bg }) => {
  return (
    <div className="col-md-3">
      <div className={`card dashboard-card text-white ${bg}`}>
        <div className="card-body">
          <h6>{title}</h6>
          <h3 className="fw-bold">{value}</h3>
        </div>
      </div>
    </div>
  );
};

export default SummaryCard;