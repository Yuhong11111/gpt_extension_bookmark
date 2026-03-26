import { Link } from 'react-router-dom';
import styled from 'styled-components';

export const AuthSection = styled.section`
  min-height: calc(100vh - 80px);
  padding: 72px 0 96px;
  background:
    radial-gradient(circle at top left, rgba(75, 89, 247, 0.18), transparent 34%),
    linear-gradient(180deg, #f7f9fc 0%, #eef2f8 100%);
`;

export const AuthGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(340px, 520px);
  gap: 48px;
  align-items: center;

  @media screen and (max-width: 960px) {
    grid-template-columns: 1fr;
  }
`;

export const AuthIntro = styled.div`
  max-width: 560px;
`;

export const AuthEyebrow = styled.p`
  margin-bottom: 16px;
  color: #4b59f7;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
`;

export const AuthHeading = styled.h1`
  margin-bottom: 20px;
  color: #101522;
  font-size: clamp(2.4rem, 4vw, 4.25rem);
  line-height: 1.02;
`;

export const AuthText = styled.p`
  margin-bottom: 16px;
  color: #4b5567;
  font-size: 18px;
  line-height: 1.65;
`;

export const AuthCard = styled.div`
  padding: 32px;
  border: 1px solid rgba(16, 21, 34, 0.08);
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 24px 60px rgba(16, 21, 34, 0.12);

  @media screen and (max-width: 640px) {
    padding: 24px 18px;
  }
`;

export const AuthForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 18px;
`;

export const FieldRow = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;

  @media screen and (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

export const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const FieldLabel = styled.label`
  color: #101522;
  font-size: 14px;
  font-weight: 700;
`;

export const FieldInput = styled.input`
  width: 100%;
  padding: 14px 16px;
  border: 1px solid rgba(16, 21, 34, 0.14);
  border-radius: 14px;
  background: #fff;
  color: #101522;
  font-size: 15px;
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;

  &:focus {
    border-color: #4b59f7;
    box-shadow: 0 0 0 4px rgba(75, 89, 247, 0.14);
  }
`;

export const AuthInlineAction = styled(Link)`
  align-self: flex-end;
  color: #4b59f7;
  font-size: 13px;
  font-weight: 700;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

export const FieldError = styled.p`
  color: #b91c1c;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.4;
`;

export const FieldCheckboxRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  color: #4b5567;

  input {
    margin-top: 4px;
  }
`;

export const FieldCheckboxLabel = styled.label`
  font-size: 14px;
  line-height: 1.5;
`;

export const AuthNotice = styled.div`
  padding: 12px 14px;
  border: 1px solid rgba(220, 38, 38, 0.18);
  border-radius: 14px;
  background: rgba(254, 226, 226, 0.75);
  color: #b91c1c;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.5;
`;

export const AuthHelperText = styled.p`
  color: #64748b;
  font-size: 14px;
  line-height: 1.5;
`;

export const AuthFooter = styled.p`
  color: #4b5567;
  font-size: 14px;

  a {
    color: #4b59f7;
    font-weight: 700;
    text-decoration: none;
  }
`;
