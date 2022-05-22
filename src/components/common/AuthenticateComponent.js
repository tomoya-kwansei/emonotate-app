import React from 'react';

import IconButton from '@mui/material/IconButton';

import { Login, Logout } from '@mui/icons-material';

import AuthenticateAPI from '../../helper/AuthenticateAPI';

const AuthenticateComponent = props => {
  const { django } = window;
  if(django.user.groups.includes("Guest") && django.user.groups.length == 1)
    return (
      <IconButton
        edge="end"
        aria-label="account of current user"
        aria-haspopup="true"
        color="inherit"
        component="a"
        href="/app/login/"
        size="large">
        <Login />
      </IconButton>
    );
  else
    return (
      <IconButton
        edge="end"
        aria-label="account of current user"
        aria-haspopup="true"
        color="inherit"
        size="large"
        onClick={_ => {
          const api = new AuthenticateAPI();
          api.logout().then(_ => {
            window.location = '/';
          });
        }}>
        <Logout />
      </IconButton>
    );
};

export default AuthenticateComponent;
