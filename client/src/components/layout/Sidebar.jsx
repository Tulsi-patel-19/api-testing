import React from 'react'

/*
work as resuable component
its like a standard form
page -> current active page
setpage -> function to switch pages
backendconnected -> whether backend connected
pages -> page info used to create naviagation buttons
 */
function Sidebar  ({page ,setPage ,backendConntected ,pages}) {
  return (
  <aside className='sidebar'>
    <h2 className='logo'>API Lab</h2>

    {Object.values(pages).map((item)=>(
        <button key={item.id}
        type='button'
        className={page === item.id ? "nav active" : "nav"}
        onClick={()=> setPage(item.id)}>
            {item.label}

        </button>
    ))}

    <div className="sidebar-button">
        <span className={
        backendConntected ? "status-dot" : "status-dot offline"}>

        </span>

        {/* {backendConntected ? "Backend Connected": "Backend Disconnected"} */}
    </div>
  </aside>
  );
}

export default Sidebar;
