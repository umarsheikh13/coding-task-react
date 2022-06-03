interface propTypes {
  type: 'button' | 'submit';
  children: any;
  color: string;
  onClick?: Function;
}

function Button({ type, color, children, onClick }: propTypes) {
  return <button type={type} className={`button button--${color}`} onClick={() => { if (typeof onClick === 'function') { onClick(); } }}>{children}</button>;
}

export default Button;
