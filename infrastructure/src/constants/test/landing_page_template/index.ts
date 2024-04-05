const LANDING_PAGE = {
  styles: [
    {
      type: 'overall',
      custom_style: { background: { color: '#ffffff' }, gap: '0px' },
    },
    {
      type: 'heading',
      block_style: { background: { color: '#00000000' } },
      custom_style: {
        color: '#000000',
        font: { family: 'Inter', size: '16px', weight: 700 },
        line_height: '16px',
        letter_spacing: '0px',
        text_alignment: 'center',
        padding: ['0px', '0px', '0px', '0px'],
      },
    },
    {
      type: 'heading',
      block_style: { background: { color: '#00000000' } },
      custom_style: {
        color: '#000000',
        background: { color: '#00000000' },
        font: { family: 'Poppins', size: '16px', weight: 700 },
        line_height: '16px',
        letter_spacing: '0px',
        text_alignment: 'center',
        padding: ['0px', '0px', '0px', '0px'],
      },
    },
    {
      type: 'paragraph',
      block_style: { background: { color: '#00000000', repeat: 'no-repeat' } },
      custom_style: {
        font: { family: 'Inter', size: '16px', weight: 400 },
        color: '#000000',
        line_height: '16px',
        letter_spacing: '0px',
        text_alignment: 'left',
        padding: ['0px', '0px', '0px', '0px'],
      },
    },
    {
      type: 'button',
      block_style: { background: { color: '#00000000' } },
      custom_style: {
        line_height: '16px',
        letter_spacing: '0px',
        color: '#ffffff',
        font: { family: 'Inter', size: '16px', weight: 400 },
        background: { color: '#39AEA9' },
        padding: ['4px', '12px', '4px', '12px'],
        radius: '4px',
        full_width: false,
      },
    },
    {
      type: 'video',
      custom_style: { full_width: true, padding: ['0px', '0px', '0px', '0px'] },
    },
    {
      type: 'image',
      custom_style: { full_width: true, padding: ['0px', '0px', '0px', '0px'] },
    },
  ],
  components: [
    {
      id: '540c8a5d-4380-4634-9796-fe7365f89cc1',
      title: 'Campaign',
      block_style: {
        padding: ['20px', '20px', '10px', '20px'],
      },
      custom_style: {},
      global_style: {
        type: 'image',
        custom_style: {
          full_width: true,
          padding: ['0px', '0px', '0px', '0px'],
        },
      },
      type: 'image',
      image_url:
        'https://t3.ftcdn.net/jpg/06/33/00/42/360_F_633004264_b6ZuRQZYAsZIEYfWdY15EAOiaG4ZJIbn.jpg',
    },
  ],
};

export { LANDING_PAGE };
