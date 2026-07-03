import { useState } from "react";

export default function Tasks() {
  const [tasks] = useState([
    { id: 1, title: "Design UI system", priority: "High" },
    { id: 2, title: "Build backend API", priority: "Critical" },
    { id: 3, title: "Setup auth system", priority: "Medium" },
  ]);

  return (
    <div>
      <h1>Tasks</h1>

      <div style={{ marginTop: "20px" }}>
        {tasks.map((task) => (
          <div
            key={task.id}
            style={{
              border: "1px solid #ddd",
              padding: "10px",
              marginBottom: "10px",
            }}
          >
            <h3>{task.title}</h3>
            <p>Priority: {task.priority}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
