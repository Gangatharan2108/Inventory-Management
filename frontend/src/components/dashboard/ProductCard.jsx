import { Link } from "react-router-dom";

const ProductCard = ({ product }) => {
  const isLowStock = product.stock_quantity <= product.minimum_stock;

  const getProgressColor = () => {
    if (product.stock_percent > 60) return "bg-success";
    if (product.stock_percent > 30) return "bg-warning";
    return "bg-danger";
  };

  const formatCurrency = (value) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(value || 0);

  return (
    <div className="col-lg-4 col-md-6">
      <div className="card product-card shadow-sm border-0 rounded-4 h-100 overflow-hidden">

        {/* IMAGE SECTION */}
        <div
          style={{
            height: "200px",
            overflow: "hidden",
            position: "relative",
          }}
        >
          <img
            src={
              product.image ||
              "https://via.placeholder.com/500x400?text=No+Image"
            }
            alt={product.product_name}
            className="w-100 h-100"
            style={{
              objectFit: "cover",
              transition: "transform 0.4s ease",
            }}
            onMouseOver={(e) =>
              (e.currentTarget.style.transform = "scale(1.08)")
            }
            onMouseOut={(e) =>
              (e.currentTarget.style.transform = "scale(1)")
            }
          />

          {/* Stock Badge Overlay */}
          <div
            style={{
              position: "absolute",
              top: "10px",
              right: "10px",
            }}
          >
            {isLowStock ? (
              <span className="badge bg-danger shadow-sm">
                Low Stock
              </span>
            ) : (
              <span className="badge bg-success shadow-sm">
                Available
              </span>
            )}
          </div>
        </div>

        {/* CARD BODY */}
        <div className="card-body d-flex flex-column">

          {/* Title */}
          <h5 className="fw-bold text-primary mb-1 text-truncate">
            {product.product_name}
          </h5>

          {/* Category */}
          <p className="text-muted small mb-2">
            <i className="bi bi-tag me-1"></i>
            {product.category_name || "-"}
          </p>

          {/* Price */}
          <div className="mb-3">
            <small className="text-muted">Selling Price</small>
            <div className="fs-5 fw-semibold text-success">
              {formatCurrency(product.selling_price)}
            </div>
          </div>

          {/* Stock Progress */}
          <div className="mb-3">
            <small className="text-muted">Stock Level</small>

            <div className="progress mt-1" style={{ height: "6px" }}>
              <div
                className={`progress-bar ${getProgressColor()}`}
                style={{ width: `${product.stock_percent || 0}%` }}
              ></div>
            </div>

            <small className="text-muted">
              {product.stock_quantity} / {product.maximum_stock} (
              {product.stock_percent || 0}%)
            </small>
          </div>

          {/* Buttons */}
          <div className="mt-auto d-flex justify-content-between">
            <Link
              to={`/products/edit/${product.id}`}
              className="btn btn-outline-warning btn-sm rounded-3"
            >
              <i className="bi bi-pencil"></i>
            </Link>

            <Link
              to={`/products/delete/${product.id}`}
              className="btn btn-outline-danger btn-sm rounded-3"
            >
              <i className="bi bi-trash"></i>
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ProductCard;