import styles from './react.module.scss';
import { uuid } from '@we-sync/core';

export function React() {
  uuid();

  return (
    <div className={styles['container']}>
      <h1>Welcome to React!</h1>
    </div>
  );
}

export default React;
