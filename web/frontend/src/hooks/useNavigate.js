import { useHistory } from 'react-router-dom';

function useNavigate() {
  const history = useHistory();

  return (to) => {
    history.push(to);
  };
}

export default useNavigate;
