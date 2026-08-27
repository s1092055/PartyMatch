export const SUB_PRIMARY_ACTION = {
  pending:            { key: 'markPaid',        label: '標記已付款',   type: 'button', variant: 'success'  },
  overdue:            { key: 'markPaid',         label: '補繳款項',     type: 'button', variant: 'danger'   },
  markedPaid:         { key: 'awaitConfirm',     label: '等待確認',     type: 'badge',  style: 'violet'     },
  confirmed:          { key: 'paymentConfirmed', label: '付款已確認',   type: 'badge',  style: 'emerald'    },
  waiting_activation: { key: 'waitActivation',   label: '等待團主啟用', type: 'badge',  style: 'violet'     },
  paid:               { key: 'viewRecords',      label: '查看紀錄',     type: 'link'                        },
}

export const SUB_SECONDARY_ACTIONS = {
  pending:            ['viewGroup', 'contactHost'],
  overdue:            ['viewGroup', 'contactHost'],
  markedPaid:         ['viewGroup'],
  confirmed:          ['viewGroup'],
  waiting_activation: ['viewGroup'],
  paid:               ['viewGroup'],
}
