import styled from '@emotion/styled';

import { colors, radii } from '@/styles/tokens';

export const Intro = styled.header`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(260px, 430px);
  gap: 28px;
  align-items: end;
  margin-bottom: 26px;

  h1 {
    margin-top: 12px;
  }

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

export const StatusPill = styled.span`
  display: inline-flex;
  padding: 7px 11px;
  border: 1px solid #e8b78d;
  border-radius: ${radii.round};
  color: ${colors.warning};
  background: #fff8ed;
  font-size: 12px;
  font-weight: 800;
`;

export const FactGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;

  @media (max-width: 550px) {
    grid-template-columns: 1fr;
  }
`;

export const FactCard = styled.div`
  min-width: 0;
  padding: 13px;
  border: 1px solid ${colors.border};
  border-radius: ${radii.medium};
  background: ${colors.surface};

  strong,
  span {
    display: block;
  }

  strong {
    font-size: 20px;
    letter-spacing: -0.04em;
  }

  span {
    margin-top: 3px;
    color: ${colors.textMuted};
    font-size: 11px;
    line-height: 1.4;
  }
`;

export const Notice = styled.p`
  margin: 12px 0;
  padding: 13px 16px;
  border-left: 4px solid ${colors.warning};
  border-radius: ${radii.small};
  color: ${colors.text};
  background: #fff8ed;
  font-size: 13px;
  line-height: 1.65;

  code {
    font-size: 12px;
  }
`;

export const JumpLinks = styled.nav`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 23px 0;

  a {
    padding: 9px 14px;
    border: 1px solid ${colors.borderStrong};
    border-radius: ${radii.round};
    color: ${colors.brandDark};
    background: ${colors.surface};
    font-size: 13px;
    font-weight: 800;
    text-decoration: none;
  }

  a:hover,
  a:focus-visible {
    border-color: ${colors.brand};
    outline: 2px solid ${colors.brand};
    outline-offset: 2px;
  }
`;

export const PreviewSection = styled.section`
  margin-top: 26px;
  scroll-margin-top: 24px;
`;

export const PreviewHeading = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: end;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;

  span {
    color: ${colors.brand};
    font-size: 11px;
    font-weight: 900;
    letter-spacing: 0.1em;
  }

  h2 {
    margin: 3px 0 0;
    font-size: clamp(23px, 3vw, 30px);
    letter-spacing: -0.035em;
  }

  p {
    max-width: 440px;
    margin: 0;
    color: ${colors.textMuted};
    font-size: 13px;
    line-height: 1.5;
  }
`;
