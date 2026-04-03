// src/pages/NoAccess.jsx
// எந்த permission-உம் இல்லாத user-க்கு இந்த page காட்டும்
export default function NoAccess() {
  return (
    <div className="d-flex flex-column align-items-center justify-content-center min-vh-100 text-center">
      <i className="bi bi-lock-fill text-danger" style={{ fontSize: 64 }}></i>
      <h3 className="mt-3 fw-bold">No Access</h3>
      <p className="text-muted">
        You don't have permission to view any page.<br />
        Please contact your administrator.
      </p>
    </div>
  );
}