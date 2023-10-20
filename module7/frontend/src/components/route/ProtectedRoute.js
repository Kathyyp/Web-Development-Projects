// import React, { Fragment } from 'react'
// import { Routes, Route, Navigate  } from 'react-router-dom'
import {useDispatch, useSelector } from 'react-redux'
import { Navigate } from 'react-router-dom'
import { loadUser } from '../../actions/userActions'
import { useEffect } from 'react'


const ProtectedRoute = ({children, isAdmin }) => {
    
    const { isAuthenticated, loading, user } = useSelector(state => state.auth)
    const dispatch = useDispatch();
    
    useEffect(() => {

        if (!user){
            dispatch(loadUser());
        }
    }, [isAuthenticated, loading, dispatch, user]);
    if(loading) return <h1>loading...</h1>;
    if(!loading && isAuthenticated){
        if (isAdmin === true && user.role !== 'admin') {
            return <Navigate  to="/" />
        }
        return children;
    }else{
        return <Navigate to={"/login"}/>
    }
    // return (
    //     <Fragment>
    //         {loading === false && (
    //            <Routes>
    //                 <Route
    //                 {...rest}
    //                 render={props => {
    //                     if (isAuthenticated === false) {
    //                         return <Navigate  to='/login' />
    //                     }

    //                     if (isAdmin === true && user.role !== 'admin') {
    //                         return <Navigate  to="/" />
    //                     }

    //                     return <Component {...props} />
    //                 }}
    //             />
    //            </Routes>
    //         )}
    //     </Fragment>
    // )
};

export default ProtectedRoute